import Tippy from '@tippyjs/react';
import Swal from 'sweetalert2';
import 'tippy.js/dist/tippy.css';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './style.css';
import Header from "./Header/Header.js";
import Sidebar from "./SideBar/SideBar.js";

const DisplayConvention = () => {
  const [conventions, setConventions] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [filiereOptions, setFiliereOptions] = useState([]);
  const [promotionOptions, setPromotionOptions] = useState([]);
  const [selectedPromotion, setSelectedPromotion] = useState('');
  const [selectedFiliere, setSelectedFiliere] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [selectedConvention, setSelectedConvention] = useState(null);
  const signaturePad = useRef(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [conventionsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);


  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/login');
    if (token) {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user.role !== 'Administrateur') {
                navigate('/PageNonTrouvee');

      }
    }
  }, [navigate]);
  useEffect(() => {
  const handleStorageChange = (event) => {
    if (event.key === 'logout') {
      navigate('/login');
    }
  };
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);


  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(userData);
    fetchSignedConventions();
  }, []);

  useEffect(() => {
    if (signaturePad.current && showSignatureModal) {
      const canvas = signaturePad.current;
      const ctx = canvas.getContext('2d');
      let isDrawing = false;
      let lastX = 0;
      let lastY = 0;

      const startDrawing = (e) => {
        isDrawing = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];
      };

      const draw = (e) => {
        if (!isDrawing) return;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
        [lastX, lastY] = [e.offsetX, e.offsetY];
      };

      const stopDrawing = () => {
        isDrawing = false;
      };

      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDrawing);
      canvas.addEventListener('mouseout', stopDrawing);

      return () => {
        canvas.removeEventListener('mousedown', startDrawing);
        canvas.removeEventListener('mousemove', draw);
        canvas.removeEventListener('mouseup', stopDrawing);
        canvas.removeEventListener('mouseout', stopDrawing);
      };
    }
  }, [showSignatureModal]);

 const fetchSignedConventions = () => {
  setIsLoading(true); // Make sure loading starts before the request

  axios.get('http://localhost:5000/api/conventions/signed')
    .then(response => {
      console.log("Raw API response:", response.data);

      const fullySignedConventions = response.data.filter(conv =>
        conv.encadrantUniSigne && conv.encadrantProSigne
      );

      console.log("Filtered conventions:", fullySignedConventions);
      setConventions(fullySignedConventions);

      const filieres = [...new Set(
        fullySignedConventions
          .map(conv => conv.etudiant?.filiere)
          .filter(f => f)
      )];

      const promotions = [...new Set(
        fullySignedConventions
          .map(conv => conv.etudiant?.promotion)
          .filter(p => p)
      )];

      setFiliereOptions(filieres);
      setPromotionOptions(promotions);
    })
    .catch(error => {
      console.error('Error details:', error.response?.data || error.message);
    })
    .finally(() => {
      setIsLoading(false); // Now this will run properly regardless of success or error
    });
};

  
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Valide':
        return 'status-badge validated';
      case 'En cours':
        return 'status-badge pending';
      case 'Non Valide':
        return 'status-badge rejected';
      default:
        return 'status-badge';
    }
  };

  const handleDownloadConvention = (convention) => {
    if (!convention?.fichier) {
      Swal.fire({
        title: 'Erreur',
        text: 'Aucun fichier de convention disponible',
        icon: 'error'
      });
      return;
    }

    const fileUrl = `http://localhost:5000${convention.fichier}`;
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = `convention-signee-${convention.etudiant?.utilisateur?.nom}-${convention.etudiant?.utilisateur?.prenom}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSignConvention = async (conventionId, etudiantId) => {
    if (!signaturePad.current) {
      Swal.fire({
        icon: 'error',
        title: 'Signature manquante',
        text: 'Veuillez fournir une signature avant de signer.',
      });
      return;
    }

    const canvas = signaturePad.current;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const isEmpty = Array.from(imageData.data).every(channel => channel === 0);

    if (isEmpty) {
      Swal.fire({
        icon: 'error',
        title: 'Signature manquante',
        text: 'Veuillez fournir une signature avant de signer.',
      });
      return;
    }

    const signature = signaturePad.current.toDataURL('image/png');

    try {
      await axios.put(`http://localhost:5000/api/conventions/admin-signer/${conventionId}`, {
        signature,
        originalPdfPath: selectedConvention.fichier
      });

      // Update student status
      await axios.put(
        `http://localhost:5000/api/etudiants/${etudiantId}/update-status`,
        { statut: 'EN_STAGE' }
      );

      Swal.fire({
        icon: 'success',
        title: 'Convention signée avec succès',
      });

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setShowSignatureModal(false);
      fetchSignedConventions(); // Refresh the list after signing
    } catch (error) {
      console.error('Erreur lors de la signature:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error?.response?.data?.message || 'Une erreur est survenue lors de la signature.',
      });
    }
  };

  const clearSignature = () => {
    if (signaturePad.current) {
      const ctx = signaturePad.current.getContext('2d');
      ctx.clearRect(0, 0, signaturePad.current.width, signaturePad.current.height);
    }
  };

  const filteredConventions = conventions.filter(convention => {
    const fullName = `${convention.etudiant?.utilisateur?.nom} ${convention.etudiant?.utilisateur?.prenom}`.toLowerCase();
    const matchesPromotion = selectedPromotion ? convention.etudiant?.promotion === selectedPromotion : true;
    const matchesFiliere = selectedFiliere ? convention.etudiant?.filiere === selectedFiliere : true;
    const matchesSearch = searchTerm ? fullName.includes(searchTerm.toLowerCase()) : true;
    return matchesPromotion && matchesFiliere && matchesSearch;
  });

  // Get current conventions for pagination
  const indexOfLastConvention = currentPage * conventionsPerPage;
  const indexOfFirstConvention = indexOfLastConvention - conventionsPerPage;
  const currentConventions = filteredConventions.slice(indexOfFirstConvention, indexOfLastConvention);
  const totalPages = Math.ceil(filteredConventions.length / conventionsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const resetFilters = () => {
    setSelectedPromotion('');
    setSelectedFiliere('');
    setSearchTerm('');
    setCurrentPage(1); // Reset to first page when resetting filters
  };

  const showSignatures = (convention) => {
    setSelectedConvention(convention);
    setShowSignatureModal(true);
  };

  return (
    <div className={`app-container ${isSidebarCollapsed ? 'collapsed' : 'expanded'}`}>
       {isLoading ? (
        <div className="loader-container">
          <div id="wifi-loader">
            <svg className="circle-outer" viewBox="0 0 86 86">
              <circle className="back" cx="43" cy="43" r="40"></circle>
              <circle className="front" cx="43" cy="43" r="40"></circle>
              <circle className="new" cx="43" cy="43" r="40"></circle>
            </svg>
            <svg className="circle-middle" viewBox="0 0 60 60">
              <circle className="back" cx="30" cy="30" r="27"></circle>
              <circle className="front" cx="30" cy="30" r="27"></circle>
            </svg>
            <svg className="circle-inner" viewBox="0 0 34 34">
              <circle className="back" cx="17" cy="17" r="14"></circle>
              <circle className="front" cx="17" cy="17" r="14"></circle>
            </svg>
            <div className="text" data-text="Chargement"></div>
          </div>
        </div>
      ) : (
        <>
      <Header currentUser={currentUser} isSidebarCollapsed={isSidebarCollapsed} />
      <Sidebar 
        activeItem="agreements"
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
      />

      <div className="main-content">
        <div className="student-container">
          <div className="header-section">
            <h1 className="page-title">Conventions Signées</h1>
            <input
              type="text"
              className="search-bar"
              placeholder="Recherche par étudiant..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }}
            />
          </div>

          <div className="filters-section">
            <select
              className="dropdown-filter"
              value={selectedPromotion}
              onChange={(e) => {
                setSelectedPromotion(e.target.value);
                setCurrentPage(1); // Reset to first page when changing filter
              }}
            >
              <option value="">Toutes les promotions</option>
              {promotionOptions.map((promotion, index) => (
                <option key={index} value={promotion}>{promotion}</option>
              ))}
            </select>

            <select
              className="dropdown-filter"
              value={selectedFiliere}
              onChange={(e) => {
                setSelectedFiliere(e.target.value);
                setCurrentPage(1); // Reset to first page when changing filter
              }}
            >
              <option value="">Toutes les filières</option>
              {filiereOptions.map((filiere, index) => (
                <option key={index} value={filiere}>{filiere}</option>
              ))}
            </select>

            <button className="reset-filters" onClick={resetFilters}>
              <i className="fas fa-redo"></i>
            </button>
          </div>

          <div className="table-wrapper">
            <table className="student-table">
              <thead>
                <tr>
                  <th>Étudiant</th>
                  <th>Filière</th>
                  <th>Promotion</th>
                  <th>Convention</th>
                  <th>Date de dépot</th>
                  <th>État</th>
                </tr>
              </thead>
              <tbody>
                {currentConventions.length > 0 ? (
                  currentConventions.map(convention => (
                    <tr key={convention._id}>
                      <td>{convention.etudiant?.utilisateur?.nom} {convention.etudiant?.utilisateur?.prenom}</td>
                      <td>{convention.etudiant?.filiere}</td>
                      <td>{convention.etudiant?.promotion}</td>
                      <td>
                        <span 
                          onClick={() => handleDownloadConvention(convention)} 
                          style={{ cursor: 'pointer', color: '#1976d2' }}
                        >
                          <i className="fas fa-expand"></i> Aperçu
                        </span>
                      </td>
                      <td>{new Date(convention.dateCreation).toLocaleDateString()}</td>
                      <td>
                        <span className={getStatusBadgeClass(convention.etatConvention)}>
                          {convention.etatConvention}
                        </span>
                      </td>                        
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center' }}>
                      Aucune convention signée disponible.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="pagination-container">
            <button 
              onClick={() => paginate(currentPage - 1)} 
              disabled={currentPage === 1}
              className="pagination-button"
            >
              &laquo; Précédent
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
              <button
                key={number}
                onClick={() => paginate(number)}
                className={`pagination-button ${currentPage === number ? 'active' : ''}`}
              >
                {number}
              </button>
            ))}
            
            <button 
              onClick={() => paginate(currentPage + 1)} 
              disabled={currentPage === totalPages || totalPages === 0}
              className="pagination-button"
            >
              Suivant &raquo;
            </button>
          </div>
        </div>
      </div>

      {showSignatureModal && selectedConvention && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: "540px" }}>
            <h1>Signer la Convention</h1>
            <label>
              Pour l'Etudiant: {selectedConvention.etudiant?.utilisateur?.nom} {selectedConvention.etudiant?.utilisateur?.prenom}
            </label>

            <div className="signature-container">
              <canvas
                ref={signaturePad}
                width={500}
                height={150}
                className="signature-canvas"
              />
            </div>
            <div className="submit-button-container">
              <button
                onClick={clearSignature}
                className="Modifier"
              >
                <i className="fas fa-eraser"></i> Effacer
              </button>
              
              <button
                onClick={() => handleSignConvention(selectedConvention._id, selectedConvention.etudiant?._id)}
                className="voir"
              >
                <i className="fas fa-signature"></i> Signer
              </button>
              <button
                onClick={() => setShowSignatureModal(false)}
                className="Supprimer" 
              >
                <i className="fas fa-times mr-2"></i> Annuler
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default DisplayConvention;
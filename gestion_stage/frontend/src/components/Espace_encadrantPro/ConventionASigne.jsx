import Tippy from '@tippyjs/react';
import Swal from 'sweetalert2';
import 'tippy.js/dist/tippy.css';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SignatureCanvas from 'react-signature-canvas';
import '../style.css';
import Header from "../Header/Header.js";
import Sidebar from "./SideBar/Sidebar.js";
import UniSidebar from "../Espace_encadrantUniv/Sidebar/Sidebar.js";

const ConventionASigne = () => {
  const [conventions, setConventions] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [filiereOptions, setFiliereOptions] = useState([]);
  const [promotionOptions, setPromotionOptions] = useState([]);
  const [selectedPromotion, setSelectedPromotion] = useState('');
  const [selectedFiliere, setSelectedFiliere] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showVoirModal, setShowVoirModal] = useState(false);
  const [selectedConvention, setSelectedConvention] = useState(null);
  const [encadrantins, setEncadrantins] = useState(null);
  const [isEncadrantPro, setIsEncadrantPro] = useState(false);
  const [existingSignature, setExistingSignature] = useState(null);
  const [useExistingSignature, setUseExistingSignature] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [conventionsPerPage] = useState(10);

  const signaturePad = useRef(null);
  const navigate = useNavigate();

  // Filter conventions first
  const filteredConventions = conventions.filter(convention => {
    const fullName = `${convention.etudiant?.nom || ''} ${convention.etudiant?.prenom || ''}`.toLowerCase();
    return (!selectedPromotion || convention.etudiant?.promotion === selectedPromotion)
      && (!selectedFiliere || convention.etudiant?.filiere === selectedFiliere)
      && (!searchTerm || fullName.includes(searchTerm.toLowerCase()));
  });

  // Then calculate pagination
  const indexOfLastConvention = currentPage * conventionsPerPage;
  const indexOfFirstConvention = indexOfLastConvention - conventionsPerPage;
  const currentConventions = filteredConventions.slice(indexOfFirstConvention, indexOfLastConvention);
  const totalPages = Math.ceil(filteredConventions.length / conventionsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/login');
    if (token) {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user.role !== 'EncadrantPro' && user.role !== 'EncadrantUniv') {
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

    if (userData && userData.role === 'EncadrantPro') {
      setIsEncadrantPro(true);
      axios.get(`http://localhost:5000/api/encadrantProfessionnel/by-user/${userData._id}`)
        .then(response => {
          const encadrantProId = response.data.encadrant._id;
          fetchConventions(encadrantProId, true);
          if (response.data.encadrant.utilisateur.signatureUrl) {
            setExistingSignature(response.data.encadrant.utilisateur.signatureUrl);
            setUseExistingSignature(true);
          }
        })
        .catch(error => console.error('Error fetching encadrant professional:', error));
    } else {
      setIsEncadrantPro(false);
      axios.get(`http://localhost:5000/api/encadrantUniversitaire/by-user/${userData._id}`)
        .then(response => {
          const encadrantUniId = response.data.encadrant._id;
          fetchConventions(encadrantUniId, false);
          if (response.data.encadrant.utilisateur.signatureUrl) {
            setExistingSignature(response.data.encadrant.utilisateur.signatureUrl);
            setUseExistingSignature(true);
          }
        })
        .catch(error => console.error('Error fetching encadrant universitaire:', error));
    }
  }, []);

  const fetchConventions = (encadrantId, isPro) => {
    const endpoint = isPro
      ? `http://localhost:5000/api/conventions/encadrant-pro/${encadrantId}`
      : `http://localhost:5000/api/conventions/encadrant-univ/${encadrantId}`;

    axios.get(endpoint)
      .then(response => {
        const unsignedConventions = isPro
          ? response.data.filter(conv => !conv.encadrantProSigne)
          : response.data.filter(conv => !conv.encadrantUnivSigne);

        setConventions(unsignedConventions);
        
        const filieres = [...new Set(unsignedConventions
          .map(conv => conv.etudiant?.filiere)
          .filter(f => f))];
        setFiliereOptions(filieres);
        
        const promotions = [...new Set(unsignedConventions
          .map(conv => conv.etudiant?.promotion)
          .filter(p => p))];
        setPromotionOptions(promotions);
      })
      .catch(error => console.error('Error fetching conventions:', error));
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPromotion, selectedFiliere, searchTerm]);

  const handleSignConvention = async (conventionId) => {
    if (useExistingSignature && !existingSignature) {
      Swal.fire({ icon: 'error', title: 'Signature manquante', text: 'Aucune signature existante trouvée. Veuillez créer une signature.' });
      return;
    }
    if (!useExistingSignature && (!signaturePad.current || signaturePad.current.isEmpty())) {
      Swal.fire({ icon: 'error', title: 'Signature manquante', text: 'Veuillez fournir une signature avant de signer.' });
      return;
    }

    try {
      let signatureData;
      if (useExistingSignature) {
        signatureData = existingSignature.replace('http://localhost:5000', '');
      } else {
        signatureData = signaturePad.current.toDataURL('image/png');
      }

      const payload = {
        user_id: currentUser._id,
        originalPdfPath: selectedConvention.fichier,
        signature: signatureData
      };

      const endpoint = isEncadrantPro
        ? `http://localhost:5000/api/conventions/signer/${conventionId}`
        : `http://localhost:5000/api/conventions/signUniv/${conventionId}`;

      const response = await axios.put(endpoint, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.status === 200) {
       await Swal.fire({ icon: 'success', title: 'Convention signée avec succès', confirmButtonText: 'OK',confirmButtonColor: '#3E77B4'
 });
        const res = isEncadrantPro
          ? await axios.get(`http://localhost:5000/api/encadrantProfessionnel/by-user/${currentUser._id}`)
          : await axios.get(`http://localhost:5000/api/encadrantUniversitaire/by-user/${currentUser._id}`);
        fetchConventions(res.data.encadrant._id, isEncadrantPro);
        setEncadrantins(res.data.encadrant._id);
        if (!useExistingSignature) signaturePad.current?.clear();
        setShowVoirModal(false);
      }
    } catch (error) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Erreur', 
        text: error.response?.data?.message || 'Une erreur est survenue lors de la signature.' 
      });
    }
  };

  const handleDownloadConvention = (conventionPath) => {
    const cleanPath = conventionPath.startsWith('/') ? conventionPath : `/${conventionPath}`;
    window.open(`http://localhost:5000${cleanPath}`, '_blank');
  };

  const handleRefuserConvention = async (conventionId) => {
    const result = await Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: 'Cette action va refuser la convention.',
      icon: 'warning',
            cancelButtonColor: '#cacbcc',
          confirmButtonColor: '#3E77B4',
      showCancelButton: true,
      confirmButtonText: 'Oui, refuser',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        await axios.put(`http://localhost:5000/api/conventions/refuser/${conventionId}`);
        await Swal.fire('Refusée!', 'La convention a été refusée.', 'success');
        
        const res = isEncadrantPro
          ? await axios.get(`http://localhost:5000/api/encadrantProfessionnel/by-user/${currentUser._id}`)
          : await axios.get(`http://localhost:5000/api/encadrantUniversitaire/by-user/${currentUser._id}`);
        
        fetchConventions(res.data.encadrant._id, isEncadrantPro);
      } catch (error) {
        console.error('Erreur lors du refus:', error);
        Swal.fire('Erreur', 'Impossible de refuser la convention.', 'error');
      }
    }
  };

  const clearSignature = () => signaturePad.current?.clear();

  const resetFilters = () => {
    setSelectedPromotion('');
    setSelectedFiliere('');
    setSearchTerm('');
  };

  return (
    <div className={`app-container ${isSidebarCollapsed ? 'collapsed' : 'expanded'}`}>
      <Header currentUser={currentUser} isSidebarCollapsed={isSidebarCollapsed} />
      {isEncadrantPro ? (
        <Sidebar activeItem="convention" isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />
      ) : (
        <UniSidebar activeItem="convention" isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />
      )}
      <div className="main-content">
        <div className="student-container">
          <div className="header-section">
            <h1 className="page-title">Conventions à Signer</h1>
            <input 
              type="text" 
              className="search-bar" 
              placeholder="Recherche par étudiant..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className="filters-section">
            <select 
              className="dropdown-filter" 
              value={selectedPromotion} 
              onChange={(e) => setSelectedPromotion(e.target.value)}
            >
              <option value="">Toutes les promotions</option>
              {promotionOptions.map((promotion, index) => (
                <option key={index} value={promotion}>{promotion}</option>
              ))}
            </select>
            <select 
              className="dropdown-filter" 
              value={selectedFiliere} 
              onChange={(e) => setSelectedFiliere(e.target.value)}
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
                  <th>Date de création</th>
                  <th>État</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentConventions.length > 0 ? (
                  currentConventions.map(convention => (
                    <tr key={convention._id}>
                      <td>{convention.etudiant?.nom} {convention.etudiant?.prenom}</td>
                      <td>{convention.etudiant?.filiere || 'N/A'}</td>
                      <td>{convention.etudiant?.promotion || 'N/A'}</td>
                      <td>
                        <span 
                          onClick={() => handleDownloadConvention(convention.fichier)} 
                          style={{ cursor: 'pointer', color: '#1976d2' }}
                        >
                          <i className="fas fa-expand"></i> Aperçu
                        </span>
                      </td>
                      <td>{new Date(convention.dateCreation).toLocaleDateString()}</td>
                      <td>{convention.etatConvention}</td>
                      <td>
                        <Tippy content="Signer la convention">
                          <button 
                            className="voir" 
                            onClick={() => { 
                              setSelectedConvention(convention); 
                              setShowVoirModal(true); 
                            }}
                          >
                            <i className="fas fa-signature"></i>
                          </button>
                        </Tippy>
                        <Tippy content="Refuser la convention">
                          <button
                            className="Supprimer"
                            onClick={() => handleRefuserConvention(convention._id)}
                            style={{ marginLeft: '10px' }}
                          >
                            <i className="fas fa-times-circle"></i>
                          </button>
                        </Tippy>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center' }}>
                      Aucune convention à signer.
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
      {showVoirModal && selectedConvention && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: "540px" }}>
            <h3>Signer la Convention</h3>
            <div className="signature-container">
              {useExistingSignature && existingSignature ? (
                <img 
                  src={existingSignature.startsWith('http') 
                    ? existingSignature 
                    : `http://localhost:5000${existingSignature}`} 
                  alt="Signature existante" 
                  style={{ width: '100%', height: '150px', objectFit: 'contain', border: '1px solid #ccc' }} 
                />
              ) : (
                <SignatureCanvas 
                  ref={signaturePad} 
                  penColor="black" 
                  canvasProps={{ width: 500, height: 150, className: 'signature-canvas' }} 
                />
              )}
            </div>
            <div className="submit-button-container">
              {!useExistingSignature && (
                <button onClick={clearSignature} className="Modifier">
                  <i className="fas fa-eraser"></i> Effacer
                </button>
              )}
              {existingSignature && (
                <button 
                  onClick={() => setUseExistingSignature(prev => !prev)} 
                  className="Modifier"
                >
                  {useExistingSignature ? 'Utiliser le pad de signature' : 'Utiliser la signature existante'}
                </button>
              )}
              <button 
                onClick={() => handleSignConvention(selectedConvention._id)} 
                className="voir"
              >
                <i className="fas fa-signature"></i> Signer
              </button>
              <button 
                onClick={() => setShowVoirModal(false)} 
                className="Supprimer"
              >
                <i className="fas fa-times mr-2"></i> Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConventionASigne;
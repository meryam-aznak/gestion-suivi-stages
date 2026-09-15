import Tippy from '@tippyjs/react';
import Swal from 'sweetalert2';
import 'tippy.js/dist/tippy.css';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SignatureCanvas from 'react-signature-canvas';
import '../style.css';
import Header from "../Header/Header.js";
import Sidebar from "./SideBar/SideBar.js";

const DisplayConvention = () => {
  const [conventions, setConventions] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [filiereOptions, setFiliereOptions] = useState([]);
  const [promotionOptions, setPromotionOptions] = useState([]);
  const [selectedPromotion, setSelectedPromotion] = useState('');
  const [selectedFiliere, setSelectedFiliere] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [selectedConvention, setSelectedConvention] = useState(null);
  const [existingSignature, setExistingSignature] = useState(null);
  const [useExistingSignature, setUseExistingSignature] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [conventionsPerPage] = useState(10);

  const signaturePad = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/login');
    if (token) {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!(user.role === 'Doyen' || user.role === 'Vice doyen')) {
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

    if (userData) {
      fetchSignedConventions();
      axios.get(`http://localhost:5000/api/presidents/${userData._id}`)
        .then(response => {
          console.log(response.data);
          if (response.data?.signatureUrl) {
            setExistingSignature(response.data.signatureUrl);
            setUseExistingSignature(true);
          }
        })
        .catch(error => console.error('Error fetching president data:', error));
    }
  }, []);

  const fetchSignedConventions = () => {
    setIsLoading(true);
    axios.get('http://localhost:5000/api/conventions/signed')
      .then(response => {
        const fullySignedConventions = response.data.filter(conv =>
          conv.encadrantUniSigne && conv.encadrantProSigne
        );
        setConventions(fullySignedConventions);

        const filieres = [...new Set(
          fullySignedConventions.map(conv => conv.etudiant?.filiere).filter(f => f)
        )];
        const promotions = [...new Set(
          fullySignedConventions.map(conv => conv.etudiant?.promotion).filter(p => p)
        )];

        setFiliereOptions(filieres);
        setPromotionOptions(promotions);
      })
      .catch(error => console.error('Error fetching conventions:', error))
      .finally(() => setIsLoading(false));
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
    a.download = `convention-${convention.etudiant?.utilisateur?.nom}-${convention.etudiant?.utilisateur?.prenom}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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

  const handleSignConvention = async (conventionId, etudiantId) => {
    if (useExistingSignature && !existingSignature) {
      Swal.fire({
        icon: 'error',
        title: 'Signature manquante',
        text: 'Aucune signature existante trouvée. Veuillez créer une signature.'
      });
      return;
    }

    if (!useExistingSignature && (!signaturePad.current || signaturePad.current.isEmpty())) {
      Swal.fire({
        icon: 'error',
        title: 'Signature manquante',
        text: 'Veuillez fournir une signature avant de signer.'
      });
      return;
    }

    try {
      let signatureData;
      if (useExistingSignature) {
        signatureData = existingSignature.replace('http://localhost:5000', '');
      } else {
        signatureData = signaturePad.current.toDataURL('image/png');
      }

      await axios.put(`http://localhost:5000/api/conventions/admin-signer/${conventionId}`, {
        signature: signatureData,
        originalPdfPath: selectedConvention.fichier,
        user_id: currentUser._id
      });

      await axios.put(`http://localhost:5000/api/etudiants/${etudiantId}/update-status`, {
        statut: 'EN_STAGE'
      });

      await Swal.fire({
        icon: 'success',
        title: 'Convention signée avec succès',
      });

      if (!useExistingSignature) signaturePad.current.clear();
      setShowSignatureModal(false);
      fetchSignedConventions();
    } catch (error) {
      console.error('Erreur lors de la signature:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error?.response?.data?.message || 'Une erreur est survenue lors de la signature.'
      });
    }
  };

  const handleRefuserConvention = async (conventionId) => {
    const result = await Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: 'Cette action va refuser la convention.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, refuser',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        await axios.put(`http://localhost:5000/api/conventions/refuser/${conventionId}`);
        await Swal.fire('Refusée!', 'La convention a été refusée.', 'success');
        fetchSignedConventions();
      } catch (error) {
        console.error('Erreur lors du refus:', error);
        await Swal.fire('Erreur', 'Impossible de refuser la convention.', 'error');
      }
    }
  };

  const clearSignature = () => {
    if (signaturePad.current) {
      signaturePad.current.clear();
    }
  };

  const filteredConventions = conventions.filter(convention => {
    const fullName = `${convention.etudiant?.utilisateur?.nom} ${convention.etudiant?.utilisateur?.prenom}`.toLowerCase();
    const matchesPromotion = selectedPromotion ? convention.etudiant?.promotion === selectedPromotion : true;
    const matchesFiliere = selectedFiliere ? convention.etudiant?.filiere === selectedFiliere : true;
    const matchesStatus = selectedStatus ? convention.etatConvention === selectedStatus : true;
    const matchesSearch = searchTerm ? fullName.includes(searchTerm.toLowerCase()) : true;
    return matchesPromotion && matchesFiliere && matchesStatus && matchesSearch;
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
    setSelectedStatus('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  return (
    <div className={`app-container ${isSidebarCollapsed ? 'collapsed' : 'expanded'} ${showSignatureModal ? 'blurred' : ''}`}>
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
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className="filters-section">
                <select
                  className="dropdown-filter"
                  value={selectedPromotion}
                  onChange={(e) => {
                    setSelectedPromotion(e.target.value);
                    setCurrentPage(1);
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
                    setCurrentPage(1);
                  }}
                >
                  <option value="">Toutes les filières</option>
                  {filiereOptions.map((filiere, index) => (
                    <option key={index} value={filiere}>{filiere}</option>
                  ))}
                </select>

                <select
                  className="dropdown-filter"
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">Tous les états</option>
                  <option value="Valide">Validé</option>
                  <option value="En cours">En cours</option>
                  <option value="Non Valide">Non validé</option>
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
                      <th>Date de dépôt</th>
                      <th>État</th>
                      <th>Actions</th>
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
                            <span className={getStatusBadgeClass(convention.etatConvention)}
                              style={{whiteSpace: 'nowrap'}}>
                              {convention.etatConvention}
                            </span>
                          </td>
                          <td>
                            {convention.etatConvention === "En cours" && (
                              <>
                                <Tippy content="Signer la convention">
                                  <button
                                    className="voir"
                                    onClick={() => {
                                      setSelectedConvention(convention);
                                      setShowSignatureModal(true);
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
                              </>
                            )}
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
                <h3>Signer la Convention</h3>
                <p>
                  Pour l'Étudiant : {selectedConvention.etudiant?.utilisateur?.nom} {selectedConvention.etudiant?.utilisateur?.prenom}
                </p>

                <div className="signature-container">
                  {useExistingSignature && existingSignature ? (
                    <img
                      src={existingSignature.startsWith('http') ? existingSignature : `http://localhost:5000${existingSignature}`}
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
                    onClick={() => handleSignConvention(selectedConvention._id, selectedConvention.etudiant?.utilisateur?._id)}
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
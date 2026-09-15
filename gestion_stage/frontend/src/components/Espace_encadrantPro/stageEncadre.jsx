import '../style.css';
import Tippy from '@tippyjs/react';
import Swal from 'sweetalert2';
import 'tippy.js/dist/tippy.css';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from "../Header/Header.js";
import Sidebar from "./SideBar/Sidebar.js";
import '@fortawesome/fontawesome-free/css/all.min.css';

const StagePro = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [encadrantProId, setEncadrantProId] = useState(null);
  const [stages, setStages] = useState([]);
  const [filteredStages, setFilteredStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filieres, setFilieres] = useState([]);
  const [conventions, setConventions] = useState({});
  
  // Filtres
  const [selectedPromotion, setSelectedPromotion] = useState('');
  const [selectedFiliere, setSelectedFiliere] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [promotionOptions, setPromotionOptions] = useState([]);
  
  // Modal
  const [selectedStage, setSelectedStage] = useState(null);
  const [showVoirModal, setShowVoirModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Sidebar
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [stagesPerPage] = useState(10);
  
  const navigate = useNavigate();

  // Vérification de l'authentification
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
    if (token) {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user.role !== 'EncadrantPro') {
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

  // Récupération de l'encadrant pro et des filières
  useEffect(() => {
    const fetchData = async () => {
      const userData = JSON.parse(localStorage.getItem("user"));
      setCurrentUser(userData);

      try {
        // Fetch filieres
        const filieresResponse = await axios.get('http://localhost:5000/api/filieres');
        setFilieres(filieresResponse.data);

        if (userData?._id) {
          const encadrantResponse = await axios.get(
            `http://localhost:5000/api/encadrantProfessionnel/by-user/${userData._id}`
          );
          setEncadrantProId(encadrantResponse.data.encadrant._id);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
        setError("Erreur lors de la récupération des données");
      }
    };

    fetchData();
  }, []);

  // Récupération des stages et conventions
  useEffect(() => {
    const fetchStages = async () => {
      if (!encadrantProId) return;
      
      setLoading(true);
      try {
        const response = await axios.get(
          `http://localhost:5000/api/stage/encadrantPro/${encadrantProId}`,
          {
            params: {
              populate: 'etudiant.filiere,etudiant.utilisateur,encadrantUniv.utilisateur'
            }
          }
        );
        
        if (response.data.message === "Aucun stage trouvé pour cet encadrant professionnel.") {
          setStages([]);
          setFilteredStages([]);
          setError(null);
        } 
        else if (response.data.success) {
          const stagesData = response.data.data || [];
          const formattedStages = Array.isArray(stagesData) ? stagesData : [stagesData];
          setStages(formattedStages);
          setFilteredStages(formattedStages);
          
          // Extract unique promotions from stages
          const promotions = [...new Set(formattedStages.map(s => s.etudiant?.promotion).filter(Boolean))];
          setPromotionOptions(promotions);

          // Fetch conventions for each student
          const conventionsData = {};
          for (const stage of formattedStages) {
            if (stage.etudiant?._id) {
              try {
                const conventionResponse = await axios.get(
                  `http://localhost:5000/api/conventions/etudiant/${stage.etudiant._id}`
                );
                if (conventionResponse.data) {
                  conventionsData[stage.etudiant._id] = conventionResponse.data;
                }
              } catch (error) {
                console.error("Error fetching convention:", error);
              }
            }
          }
          setConventions(conventionsData);
        }
        else {
          throw new Error(response.data.message || "Erreur inconnue");
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des stages:", error);
        if (error.response?.data?.message !== "Aucun stage trouvé pour cet encadrant professionnel.") {
          setError(error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStages();
  }, [encadrantProId]);

  // Filtrage des stages
  useEffect(() => {
    const filtered = stages.filter(stage => {
      const etudiantName = stage.etudiant?.utilisateur 
        ? `${stage.etudiant.utilisateur.nom} ${stage.etudiant.utilisateur.prenom}`.toLowerCase()
        : '';
      
      const matchesPromotion = selectedPromotion 
        ? stage.etudiant?.promotion === selectedPromotion 
        : true;
      const matchesFiliere = selectedFiliere 
        ? stage.etudiant?.filiere?._id === selectedFiliere 
        : true;
      const matchesStatut = selectedStatut 
        ? stage.statut === selectedStatut 
        : true;
      const matchesSearch = searchTerm 
        ? etudiantName.includes(searchTerm.toLowerCase()) 
        : true;

      return matchesPromotion && matchesFiliere && matchesStatut && matchesSearch;
    });

    setFilteredStages(filtered);
  }, [selectedPromotion, selectedFiliere, selectedStatut, searchTerm, stages]);

  // Pagination logic
  const indexOfLastStage = currentPage * stagesPerPage;
  const indexOfFirstStage = indexOfLastStage - stagesPerPage;
  const currentStages = filteredStages.slice(indexOfFirstStage, indexOfLastStage);
  const totalPages = Math.ceil(filteredStages.length / stagesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPromotion, selectedFiliere, selectedStatut, searchTerm]);

  const resetFilters = () => {
    setSelectedPromotion('');
    setSelectedFiliere('');
    setSelectedStatut('');
    setSearchTerm('');
  };

  const handleUpdateStage = async (stageId, updatedData) => {
    try {
      const payload = {
        sujet: updatedData.sujet,
        dateDebut: updatedData.dateDebut,
        dateFin: updatedData.dateFin,
        horaire: updatedData.horaire,
      };

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      };

      const response = await axios.put(
        `http://localhost:5000/api/stage/${stageId}`,
        payload,
        config
      );

      if (response.data.success) {
        setStages(prev => prev.map(stage => 
          stage._id === stageId ? { ...stage, ...response.data.data } : stage
        ));
        
        setFilteredStages(prev => prev.map(stage => 
          stage._id === stageId ? { ...stage, ...response.data.data } : stage
        ));

        await Swal.fire({
          title: 'Succès!',
          text: 'Stage modifié avec succès',
          icon: 'success',
          confirmButtonText: 'OK'
        });

        return true;
      }
    } catch (error) {
      console.error("Erreur complète:", error);
      
      let errorMessage = "Une erreur est survenue lors de la modification";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = Object.values(error.response.data.errors).join('\n');
      }

      await Swal.fire({
        title: 'Erreur!',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'OK'
      });

      return false;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const getConventionStatus = (etudiantId) => {
    if (!etudiantId) return 'NON_DEPOSEE';
    return conventions[etudiantId]?.etatConvention || 'NON_DEPOSEE';
  };

  const getConventionUrl = (etudiantId) => {
    if (!etudiantId) return null;
    return conventions[etudiantId]?.fichier || null;
  };

  const formatNatureDisplay = (nature) => {
    if (!nature) return 'Non spécifiée';
    
    const displayMap = {
      'Stage de Fin d Etude': "Stage de fin d'étude",
      'Stage de recherche': 'Stage de recherche'
    };
    
    return displayMap[nature] || nature;
  };

  const statutOptions = ['EN_ATTENTE', 'EN_COURS', 'TERMINE'];
if (loading) {
    return <div className="app-container">
        <div className="main-content">
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
        </div>
      </div>;
  }
  return (
    <div className={`app-container ${isSidebarCollapsed ? 'collapsed' : 'expanded'}`}>
      <Header currentUser={currentUser} isSidebarCollapsed={isSidebarCollapsed} />
      <Sidebar
        activeItem="stage"
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
      />

      <div className="main-content">
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)} className="dismiss-error">
              ×
            </button>
          </div>
        )}

        <div className="student-container">
          <div className="header-section">
            <h1 className="page-title">Mes Stages Encadrés</h1>
            <input
              type="text"
              className="search-bar"
              placeholder="Rechercher par étudiant..."
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
              {filieres.map((filiere) => (
                <option key={filiere._id} value={filiere._id}>{filiere.nom}</option>
              ))}
            </select>

            <select
              className="dropdown-filter"
              value={selectedStatut}
              onChange={(e) => setSelectedStatut(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              {statutOptions.map((statut, index) => (
                <option key={index} value={statut}>
                  {statut.replace('_', ' ').toLowerCase()}
                </option>
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
                  <th>Sujet</th>
                  <th>Étudiant</th>
                  <th>Promotion</th>
                  <th>Filière</th>
                  <th>Date Début</th>
                  <th>Date Fin</th>
                  <th>Statut</th>
                  <th>Convention</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentStages.length > 0 ? (
                  currentStages.map(stage => {
                    const etudiantId = stage.etudiant?._id;
                    const conventionStatus = getConventionStatus(etudiantId);
                    const conventionUrl = getConventionUrl(etudiantId);
                    
                    return (
                      <tr key={stage._id}>
                        <td>{stage.sujet || 'Non spécifié'}</td>
                        <td>
                          {stage.etudiant?.utilisateur
                            ? `${stage.etudiant.utilisateur.prenom} ${stage.etudiant.utilisateur.nom || ''}`
                            : 'Non assigné'}
                        </td>
                        <td>{stage.etudiant?.promotion || 'Non spécifiés'}</td>
                        <td>{stage.etudiant?.filiere?.nom || 'Non spécifiés'}</td>
                        <td>{formatDate(stage.dateDebut)|| 'Non spécifiés'}</td>
                        <td>{formatDate(stage.dateFin)|| 'Non spécifiés'}</td>
                        <td>
                            {stage.statut?.replace('_', ' ').toLowerCase()}
                        </td>
                        <td>
                          {conventionUrl ? (
                            <a 
                              href={`http://localhost:5000${conventionUrl}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="convention-link" 
                            > <i className="fas fa-file-pdf"></i>
                                {conventionStatus.replace('_', ' ').toLowerCase()}
                            </a>
                          ) : (
                            <span className={`convention-status non-deposee`}>
                              non déposée
                            </span>
                          )}
                        </td>
                        <td className="actions-cell">
                          <Tippy content="Voir les détails">
                            <button 
                            className="voir" 
                              onClick={() => {
                                setSelectedStage({
                                  ...stage,
                                  convention: conventions[stage.etudiant?._id]
                                });
                                setShowVoirModal(true);
                              }}
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                          </Tippy>

                          <Tippy content="Modifier">
                            <button 
                              className="Modifier" 
                              onClick={() => {
                                setSelectedStage(stage);
                                setShowEditModal(true);
                              }}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                          </Tippy>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="no-results">
                      Aucun stage trouvé.
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
        
        {/* Modal de visualisation */}
        {showVoirModal && selectedStage && (
          <div className="modal-overlay">
            <div className="modal-content stage-info-modal">
              <div className="modal-header">
                <h2 className="modal-title">Informations sur le Stage</h2>
              </div>
              <div className="grid-container">
                  
                   {/* Stage */}
                <div className="info-box">
                  <h3>
                <i className="fas fa-file-alt" style={{ marginRight: 8 }}></i>
                Stage de Master
                  </h3>
                    <p><strong>Sujet :</strong> {selectedStage.sujet || 'Non spécifié'}</p>
                    <p><strong>Nature :</strong> {formatNatureDisplay(selectedStage.nature) || 'Non spécifiée'}</p>
                    
                    <p><strong>Horaire :</strong> {selectedStage.horaire || 'Non spécifié'}</p>
                    <p><strong>Promotion :</strong> {selectedStage.etudiant?.promotion || 'Non spécifiés'}</p>
                    <p><strong>Filière :</strong> {selectedStage.etudiant?.filiere?.nom || 'Non spécifiés'}</p>
                    <p><strong>Date Début :</strong> {formatDate(selectedStage.dateDebut)|| 'Non spécifiés'}</p>
                    <p><strong>Date Fin :</strong> {formatDate(selectedStage.dateFin)|| 'Non spécifiés'}</p>
                    <p><strong>Statut :</strong> {selectedStage.statut?.replace('_', ' ').toLowerCase()}</p>
                    <p><strong>Objectifs :</strong> {selectedStage.Objectifs || 'Non spécifiés'}</p>
                    <p>
                      <strong>État : </strong> 
                      <span className={`convention-status ${selectedStage.convention?.etatConvention?.toLowerCase().replace('_', '-') || 'non-deposee'}`}>
                        {selectedStage.convention?.etatConvention?.replace('_', ' ').toLowerCase() || 'non déposée'}
                      </span>
                    </p>
                    {selectedStage.convention?.fichier && (
                    <p>
                      <strong>Document : </strong> 
                      <a 
                        href={`http://localhost:5000${selectedStage.convention.fichier}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="document-link"
                      >
                        Voir la convention
                      </a>
                    </p>)}
                </div>
                    
                     {/* Étudiant */}
                <div className="info-box">
                  <h3>
                <i className="fas fa-user-graduate" style={{ marginRight: 8 }}></i>
                Informations d'Étudiant
                  </h3>
                    <p><strong>Nom :</strong> {selectedStage.etudiant?.utilisateur?.nom || 'Non assigné'}</p>
                    <p><strong>Prénom :</strong> {selectedStage.etudiant?.utilisateur?.prenom  || 'Non spécifiés'}</p>
                    <p><strong>Email :</strong> {selectedStage.etudiant?.utilisateur?.email || 'Non spécifiés'}</p>
                    <p><strong>Téléphone :</strong> {selectedStage.etudiant?.utilisateur?.telephone || 'Non spécifiés'}</p>
                    <p><strong>Promotion :</strong> {selectedStage.etudiant?.promotion || 'Non spécifiés'}</p>
                    <p><strong>Filière :</strong> {selectedStage.etudiant?.filiere?.nom || 'Non spécifiés'}</p>
                </div>
                <div className="info-box">
                  <h3>
                <i className="fas fa-chalkboard-teacher" style={{ marginRight: 8 }}></i>
                Encadrant Universitaire
                  </h3>
                    <p><strong>Nom :</strong> {selectedStage.encadrantUniv?.utilisateur?.nom ||  'Non assigné'}</p>
                    <p><strong>Prénom :</strong> {selectedStage.encadrantUniv?.utilisateur?.prenom || 'Non assigné' }</p>
                    <p><strong>Email :</strong> {selectedStage.encadrantUniv?.utilisateur?.email || 'Non spécifiés'}</p>
                    <p><strong>Téléphone:</strong> {selectedStage.encadrantUniv?.utilisateur?.telephone || 'Non spécifiés'}</p>
                    <p><strong>Spécialité :</strong> {selectedStage.encadrantUniv?.specialite || 'Non spécifiés'}</p>
                    <p><strong>Filière :</strong> {selectedStage.encadrantUniv?.filiere?.nom || 'Non spécifiés'}</p>
                    <p><strong>Etablissement :</strong> {selectedStage.encadrantUniv?.etablissement || 'Non spécifiés'}</p>
                    <p><strong>Université :</strong> {selectedStage.encadrantUniv?.universite || 'Non spécifiés'}</p>
                </div>
                <div className="info-box">
                  <h3>
                <i className="fas fa-briefcase" style={{ marginRight: 8 }}></i>
                Encadrant Professionnel
                  </h3>
                    <p><strong>Nom :</strong> {selectedStage.encadrantPro?.utilisateur?.nom || 'Non spécifiés'}</p>
                    <p><strong>Prénom :</strong> {selectedStage.encadrantPro?.utilisateur?.prenom || 'Non spécifiés'}</p>
                    <p><strong>Email :</strong> {selectedStage.encadrantPro?.utilisateur?.email || 'Non spécifiés'}</p>
                    <p><strong>Fonction :</strong> {selectedStage.encadrantPro?.fonction || 'Non spécifiés'}</p>
                    <p><strong>Téléphone :</strong> {selectedStage.encadrantPro?.utilisateur?.telephone || 'Non spécifiés'}</p>
                </div>
                <div className="info-box">
                  <h3>
                <i className="fas fa-briefcase" style={{ marginRight: 8 }}></i>
                Organisme d'accueil
                  </h3>
                    
                    <p><strong>Nom D'Organisme :</strong> {selectedStage.encadrantPro?.nomOrganisme || 'Non assigné'}</p>
                    <p><strong>Téléphone D'Organisme :</strong> {selectedStage.encadrantPro?.teleOrganisme  || 'Non spécifiés'}</p>
                    <p><strong>Raison Sociale :</strong> {selectedStage.encadrantPro?.raisonSociale || 'Non spécifiés'}</p>
                </div>
              </div>
              
              <div className="submit-button-container">
                <button 
                  type="button" 
                  className="submit-button" 
                  onClick={() => setShowVoirModal(false)}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
        
        {showEditModal && selectedStage && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h1>Modifier le Stage</h1>
              </div>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target;
                
                const success = await handleUpdateStage(selectedStage._id, {
                  sujet: form.sujet.value,
                  dateDebut: form.dateDebut.value,
                  dateFin: form.dateFin.value,
                  horaire: form.horaire.value
                });

                if (success) {
                  setShowEditModal(false);
                }
              }}>
                <div className="form-row">
                  <div className="form-pair">
                    <label>Sujet:</label>
                    <input 
                      type="text" 
                      name="sujet" 
                      defaultValue={selectedStage.sujet} 
                      required 
                    />
                  </div>
                  <div className="form-pair">
                    <label>Horaire:</label>
                    <input 
                      type="text" 
                      name="horaire" 
                      defaultValue={selectedStage.horaire || ''} 
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-pair">
                    <label>Date Début:</label>
                    <input 
                      type="date" 
                      name="dateDebut" 
                      defaultValue={selectedStage.dateDebut?.split('T')[0]} 
                      required 
                    />
                  </div>
                  <div className="form-pair">
                    <label>Date Fin:</label>
                    <input 
                      type="date" 
                      name="dateFin" 
                      defaultValue={selectedStage.dateFin?.split('T')[0]} 
                      required 
                    />
                  </div>
                </div>
                
                <div className="submit-button-container">
                  <button 
                    type="button" 
                    className="cancel-button" 
                    onClick={() => setShowEditModal(false)}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="submit-button">
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StagePro;
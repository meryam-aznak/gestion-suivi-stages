import '../style.css';
import Tippy from '@tippyjs/react';
import Swal from 'sweetalert2';
import 'tippy.js/dist/tippy.css';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from "../Header/Header.js";
import Sidebar from "./Sidebar/Sidebar.js";

const EtudiantUni = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [encadrantId, setEncadrantId] = useState(null);
  const [stages, setStages] = useState([]);
  const [filteredStages, setFilteredStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filieres, setFilieres] = useState([]);
  
  // Filtres
  const [selectedPromotion, setSelectedPromotion] = useState('');
  const [selectedFiliere, setSelectedFiliere] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [promotionOptions, setPromotionOptions] = useState([]);
  
  // Modals
  const [selectedStage, setSelectedStage] = useState(null);
  const [showVoirModal, setShowVoirModal] = useState(false);
  const [showEvalModal, setShowEvalModal] = useState(false);
  
  // Evaluation form
  const [evaluationForm, setEvaluationForm] = useState({
    note: '',
    commentaires: '',
    etudiant: '',
    evaluateur: '',
    evaluateurModel: 'EncadrantUniversitaire'
  });
  
  // Sidebar
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [stagesPerPage] = useState(10);
  
  const navigate = useNavigate();

  useEffect(() => {
    const checkIfUserStillExists = async () => {
        try {
            const res = await axios.get(
                `http://localhost:5000/api/encadrantUniversitaire/utilisateur/${currentUser._id}`,
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );
            if (!res.data || !res.data._id) throw new Error("Étudiant introuvable");
        } catch (err) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            Swal.fire({
                icon: 'info',
                title: 'Compte supprimé',
                text: 'Votre compte a été supprimé par l\'administrateur.',
            }).then(() => {
                navigate('/login');
            });
        }
    };

    const interval = setInterval(checkIfUserStillExists, 10000);
    return () => clearInterval(interval);
  }, [currentUser, navigate]);

  // Vérification de l'authentification
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
    if (token) {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user.role !== 'EncadrantUniv') {
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

  // Récupération de l'encadrant et des filières
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
            `http://localhost:5000/api/encadrantUniversitaire/utilisateur/${userData._id}`
          );
          setEncadrantId(encadrantResponse.data._id);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
        setError("Erreur lors de la récupération des données");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Récupération des stages
  useEffect(() => {
    const fetchStages = async () => {
      if (!encadrantId) return;
      
      setLoading(true);
      try {
        const response = await axios.get(
          `http://localhost:5000/api/stage/encadrantUniv/${encadrantId}`,
          {
            params: {
              populate: 'etudiant.filiere,etudiant.utilisateur,encadrantPro.utilisateur'
            }
          }
        );
        
        if (response.data.message === "Aucun stage trouvé pour cet encadrant universitaire.") {
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
        }
        else {
          throw new Error(response.data.message || "Erreur inconnue");
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des stages:", error);
        if (error.response?.data?.message !== "Aucun stage trouvé pour cet encadrant universitaire.") {
          setError(error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStages();
  }, [encadrantId]);

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
    setCurrentPage(1); // Reset to first page when filters change
  }, [selectedPromotion, selectedFiliere, selectedStatut, searchTerm, stages]);

  // Pagination logic
  const indexOfLastStage = currentPage * stagesPerPage;
  const indexOfFirstStage = indexOfLastStage - stagesPerPage;
  const currentStages = filteredStages.slice(indexOfFirstStage, indexOfLastStage);
  const totalPages = Math.ceil(filteredStages.length / stagesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const resetFilters = () => {
    setSelectedPromotion('');
    setSelectedFiliere('');
    setSelectedStatut('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Handle evaluation form changes
  const handleEvalChange = (e) => {
    const { name, value } = e.target;
    setEvaluationForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle evaluation submission
  const handleEvalSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = {
        ...evaluationForm,
        evaluateur: encadrantId
      };

      const response = await axios.post(
        'http://localhost:5000/api/evaluations',
        formData
      );

      if (response.data && response.data._id) {
        await Swal.fire({
          icon: 'success',
          title: 'Évaluation enregistrée',
          text: 'L\'évaluation a été enregistrée avec succès!',
          confirmButtonColor: '#3085d6',
        });
        
        setShowEvalModal(false);
        setEvaluationForm({
          note: '',
          commentaires: '',
          etudiant: '',
          evaluateur: '',
          evaluateurModel: 'EncadrantUniversitaire'
        });
        
        // Refresh the stages data
        const stagesResponse = await axios.get(
          `http://localhost:5000/api/stage/encadrantUniv/${encadrantId}`,
          {
            params: {
              populate: 'etudiant.filiere,etudiant.utilisateur,encadrantPro.utilisateur'
            }
          }
        );
        
        if (stagesResponse.data.success) {
          const stagesData = stagesResponse.data.data || [];
          const formattedStages = Array.isArray(stagesData) ? stagesData : [stagesData];
          setStages(formattedStages);
          setFilteredStages(formattedStages);
        }
      } else {
        throw new Error('Réponse inattendue du serveur');
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'évaluation:", error);
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error.response?.data?.message || error.message || 'Une erreur est survenue',
        confirmButtonColor: '#d33',
      });
    }
  };

  // Open evaluation modal
  const openEvalModal = (stage) => {
    setSelectedStage(stage);
    setEvaluationForm({
      note: '',
      commentaires: '',
      etudiant: stage.etudiant?._id || '',
      evaluateur: encadrantId,
      evaluateurModel: 'EncadrantUniversitaire'
    });
    setShowEvalModal(true);
  };

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

  if (error) {
    return <div className="error">{error}</div>;
  }

  const statutOptions = ['EN_ATTENTE', 'EN_COURS', 'TERMINE'];

  return (
    <div className={`app-container ${isSidebarCollapsed ? 'collapsed' : 'expanded'}`}>
      <Header currentUser={currentUser} isSidebarCollapsed={isSidebarCollapsed} />
      <Sidebar
        activeItem="encadrement"
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
            <h1 className="page-title">Étudiant Encadrés</h1>
            <input
              type="text"
              className="search-bar"
              placeholder="Rechercher par étudiant..."
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
              {filieres.map((filiere) => (
                <option key={filiere._id} value={filiere._id}>{filiere.nom}</option>
              ))}
            </select>

            <select
              className="dropdown-filter"
              value={selectedStatut}
              onChange={(e) => {
                setSelectedStatut(e.target.value);
                setCurrentPage(1);
              }}
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
                  <th>Étudiant</th>
                  <th>Promotion</th>
                  <th>Filière</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentStages.length > 0 ? (
                  currentStages.map(stage => (
                    <tr key={stage._id}>
                      <td>
                        {stage.etudiant?.utilisateur
                          ? `${stage.etudiant.utilisateur.prenom} ${stage.etudiant.utilisateur.nom || ''}`
                          : 'Non assigné'}
                      </td>
                      <td>{stage.etudiant?.promotion || 'Non spécifiés'}</td>
                      <td>{stage.etudiant?.filiere?.nom || 'Non spécifiés'}</td>
                      <td>{stage.etudiant?.utilisateur?.email || 'Non spécifiés'}</td>
                      <td>{stage.etudiant?.utilisateur?.telephone || 'Non spécifiés'}</td>
                      <td className="actions-cell">
                        <Tippy content="Voir les détails">
                          <button 
                            className="voir" 
                            onClick={() => {
                              setSelectedStage(stage);
                              setShowVoirModal(true);
                            }}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                        </Tippy>

                        <Tippy content="Voir les évaluations">
                          <button 
                            className="Modifier" 
                            onClick={() => navigate(`/evaluations/${stage.etudiant?._id}`)}
                          >
                            <i className="fas fa-list-check"></i>
                          </button>
                        </Tippy>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="no-results">
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
            <div className="modal-content">
              <div className="modal-header">
                <h1>Détails de l'étudiant</h1>
              </div>
              
              <div className="student-details">
                <p><strong>Nom :</strong> {selectedStage.etudiant?.utilisateur?.nom || 'Non assigné'}</p>
                <p><strong>Prénom :</strong> {selectedStage.etudiant?.utilisateur?.prenom  || 'Non spécifiés'}</p>
                <p><strong>Email :</strong> {selectedStage.etudiant?.utilisateur?.email || 'Non spécifiés'}</p>
                <p><strong>Téléphone:</strong> {selectedStage.etudiant?.utilisateur?.telephone || 'Non spécifiés'}</p>
                <p><strong>Promotion:</strong> {selectedStage.etudiant?.promotion || 'Non spécifiés'}</p>
                <p><strong>Filière:</strong> {selectedStage.etudiant?.filiere?.nom || 'Non spécifiés'}</p>
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

        {/* Modal d'évaluation */}
        {showEvalModal && selectedStage && (
          <div className={`modal-overlay ${isSidebarCollapsed ? 'collapsed' : 'expanded'}`}>
            <div className="modal-content">
              <h1>Évaluer l'Étudiant</h1>
              <form className="add-student-form" onSubmit={handleEvalSubmit}>
                <div className="form-row">
                  <div className="form-pair">
                    <label>Étudiant: <span className="required-star">*</span></label>
                    <input 
                      type="text" 
                      value={
                        selectedStage.etudiant?.utilisateur 
                          ? `${selectedStage.etudiant.utilisateur.prenom} ${selectedStage.etudiant.utilisateur.nom}`
                          : 'Non assigné'
                      } 
                      disabled 
                    />
                  </div>
                  <div className="form-pair">
                    <label>Promotion:</label>
                    <input 
                      type="text" 
                      value={selectedStage.etudiant?.promotion || 'Non spécifiés'} 
                      disabled 
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-pair">
                    <label>Note: <span className="required-star">*</span></label>
                    <select 
                      name="note" 
                      value={evaluationForm.note} 
                      onChange={handleEvalChange} 
                      required
                    >
                      <option value="">Sélectionner une note</option>
                      <option value="A">A - Excellent</option>
                      <option value="B">B - Très bien</option>
                      <option value="C">C - Bien</option>
                      <option value="D">D - Satisfaisant</option>
                      <option value="E">E - Échec</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-pair full-width">
                    <label>Commentaires:</label>
                    <textarea 
                      name="commentaires" 
                      value={evaluationForm.commentaires} 
                      onChange={handleEvalChange}
                      rows="4"
                    />
                  </div>
                </div>

                <div className="submit-button-container">
                  <button 
                    type="button" 
                    className="cancel-button" 
                    onClick={() => setShowEvalModal(false)}
                  >
                    <i className="fas fa-times"></i> Annuler
                  </button>
                  <button type="submit" className="submit-button">
                    <i className="fas fa-save"></i> Enregistrer
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

export default EtudiantUni;
import './style.css';
import Tippy from '@tippyjs/react';
import Swal from 'sweetalert2';
import 'tippy.js/dist/tippy.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from "./Header/Header.js";
import Sidebar from "./SideBar/SideBar.js";
import AjouterStage from './AjouterStage.js';
import VoirStage from './VoirStage.js'; 
import ModifierStage from './ModifierStage.js';

const DisplayStage = () => {
  const [stages, setStages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [etudiants, setEtudiants] = useState([]);
  const [encadrantUnivs, setEncadrantUnivs] = useState([]);
  const [encadrantPros, setEncadrantPros] = useState([]);
  const [selectedEtudiant, setSelectedEtudiant] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');
  const [selectedNature, setSelectedNature] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVoirModal, setShowVoirModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [stagesPerPage] = useState(10);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
    if (token) {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user.role!='Administrateur') {
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
    const fetchData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        setCurrentUser(userData);
        
        await Promise.all([
          fetchStages(),
          fetchEtudiants(),
          fetchEncadrantUnivs(),
          fetchEncadrantPros()
        ]);
      } catch (error) {
        setError('Failed to load data');
        console.error('Error initializing data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchStages = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/stage');
      setStages(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching stages:', error);
      setError('Failed to load stages');
      Swal.fire({
        title: 'Erreur',
        text: 'Impossible de charger la liste des stages',
        icon: 'error',
                  confirmButtonColor: '#3E77B4',

        confirmButtonText: 'OK'
      });
    }
  };

  const fetchEtudiants = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/etudiants');
      setEtudiants(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      Swal.fire({
        title: 'Erreur',
        text: 'Impossible de charger la liste des étudiants',
        icon: 'error',
        confirmButtonColor: '#3E77B4',
        confirmButtonText: 'OK'
      });
    }
  };

  const fetchEncadrantUnivs = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/encadrantUniversitaire');
      setEncadrantUnivs(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching university supervisors:', error);
      Swal.fire({
        title: 'Erreur',
        text: 'Impossible de charger la liste des encadrants universitaires',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const fetchEncadrantPros = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/encadrantProfessionnel');
      setEncadrantPros(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching professional supervisors:', error);
      Swal.fire({
        title: 'Erreur',
        text: 'Impossible de charger la liste des encadrants professionnels',
        icon: 'error',
                  confirmButtonColor: '#3E77B4',

        confirmButtonText: 'OK'
      });
    }
  };

  // Transform data for dropdowns
  const etudiantOptions = etudiants.map(etudiant => ({
    value: etudiant._id,
    label: `${etudiant.utilisateur?.nom || etudiant.nom} ${etudiant.utilisateur?.prenom || etudiant.prenom}`
  }));

  const encadrantUnivOptions = encadrantUnivs.map(encadrant => ({
    value: encadrant._id,
    label: `${encadrant.utilisateur?.nom || encadrant.nom} ${encadrant.utilisateur?.prenom || encadrant.prenom}`,
    specialite: encadrant.specialite,
    filiere: encadrant.filiere
  }));

  const encadrantProOptions = encadrantPros.map(encadrant => ({
    value: encadrant._id,
    label: `${encadrant.utilisateur?.nom || encadrant.nom} ${encadrant.utilisateur?.prenom || encadrant.prenom}`,
    fonction: encadrant.fonction,
    organisation: encadrant.nomOrganisme
  }));

  const handleAddStage = async (newStage) => {
    try {
      // Find the student in your existing etudiants state
      const matchingStudent = etudiants.find(e => e._id === newStage.etudiant);
      
      // Find the university supervisor in encadrantUnivs state
      const matchingEncadrantUniv = encadrantUnivs.find(
        (encadrant) => encadrant._id === newStage.encadrantUniv
      );
      
      // Find the professional supervisor in encadrantPros state
      const matchingEncadrantPro = encadrantPros.find(
        (encadrant) => encadrant._id === newStage.encadrantPro
      );

      // Create a stage object with all populated data
      const stageWithPopulatedData = {
        ...newStage,
        etudiant: matchingStudent || { nom: 'Non assigné' },
        encadrantUniv: matchingEncadrantUniv || { nom: 'Non assigné' },
        encadrantPro: matchingEncadrantPro || { nom: 'Non assigné' },
      };

      // Update the state with the new stage (added at the top)
      setStages(prev => [stageWithPopulatedData, ...prev]);

      // Show success message
      Swal.fire({
        title: 'Succès!',
        text: 'Stage ajouté avec succès',
        icon: 'success',
        confirmButtonText: 'OK',
         confirmButtonColor: '#3E77B4',
      });
    } catch (error) {
      console.error("Error adding stage:", error);
      Swal.fire({
        title: 'Erreur!',
        text: 'Une erreur est survenue lors de l\'ajout du stage',
        icon: 'error',
        confirmButtonText: 'OK',
                 confirmButtonColor: '#3E77B4',

      });
    }
  };

  const handleEditStage = async (updatedStage) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/stage/${updatedStage._id}`,
        updatedStage
      );

      if (response.data.success) {
        // Return the updated stage data
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Échec de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating stage:', error);
      let errorMessage = error.response?.data?.message || error.message || 'Échec de la mise à jour';
      
      if (error.response?.data?.errors) {
        errorMessage = Object.values(error.response.data.errors).join('\n');
      }

      Swal.fire({
        title: 'Erreur!',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'OK',
                 confirmButtonColor: '#3E77B4',

      });
      return null;
    }
  };

  const filteredStages = stages.filter(stage => {
    const etudiantName = stage.etudiant?.utilisateur 
      ? `${stage.etudiant.utilisateur.nom} ${stage.etudiant.utilisateur.prenom}`.toLowerCase()
      : stage.etudiant?.nom 
        ? `${stage.etudiant.nom} ${stage.etudiant.prenom || ''}`.toLowerCase()
        : '';
        
    const matchesEtudiant = selectedEtudiant ? stage.etudiant?._id === selectedEtudiant : true;
    const matchesStatut = selectedStatut ? stage.statut === selectedStatut : true;
    const matchesNature = selectedNature ? stage.nature === selectedNature : true;
    const matchesSearch = searchTerm ? etudiantName.includes(searchTerm.toLowerCase()) : true;
    
    return matchesEtudiant && matchesStatut && matchesNature && matchesSearch;
  });

  const formatNatureDisplay = (nature) => {
    if (!nature) return 'Non spécifiée';
    
    const displayMap = {
      'Stage de Fin d Etude': "Stage de fin d'étude",
      'Stage de recherche': 'Stage de recherche'
    };
    
    return displayMap[nature] || nature;
  };

  const resetFilters = () => {
    setSelectedEtudiant('');
    setSelectedStatut('');
    setSelectedNature('');
    setSearchTerm('');
  };

  const handleDeleteStage = async (stageId) => {
    const result = await Swal.fire({
      title: 'Êtes-vous sûr?',
      text: "Vous ne pourrez pas annuler cette action!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3E77B4',
      cancelButtonColor: '#cacbcc',
      confirmButtonText: 'Oui, supprimer!',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        // Optimistic update: remove the stage from UI immediately
        
        // Then make the API call
        await axios.delete(`http://localhost:5000/api/stage/${stageId}`);
              setStages(prev => prev.filter(stage => stage._id !== stageId));

        
        Swal.fire(
          'Supprimé!',
          'Le stage a été supprimé.',
          'success'
        );
      } catch (error) {
        console.error('Error deleting stage:', error);
        
        // Revert the UI if the API call fails
        fetchStages();
        
        Swal.fire(
          'Erreur!',
          'La suppression a échoué.',
          'error'
        );
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  // Pagination logic
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const indexOfLastStage = currentPage * stagesPerPage;
  const indexOfFirstStage = indexOfLastStage - stagesPerPage;
  const currentStages = filteredStages.slice(indexOfFirstStage, indexOfLastStage);
  const totalPages = Math.ceil(filteredStages.length / stagesPerPage);

  if (loading) {
    return <div className="loader-container">
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
    </div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className={`app-container ${isSidebarCollapsed ? 'collapsed' : 'expanded'} ${showAddModal ? 'blurred' : ''}`}>
      <Header currentUser={currentUser} isSidebarCollapsed={isSidebarCollapsed} />
      <Sidebar
        activeItem="internships"
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
      />

      <div className="main-content">
        <div className="student-container">
          <div className="header-section">
            <h1 className="page-title">Liste Des Stages</h1>
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
              value={selectedEtudiant}
              onChange={(e) => {
                setSelectedEtudiant(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Tous les étudiants</option>
              {etudiantOptions.map((etudiant, index) => (
                <option key={index} value={etudiant.value}>{etudiant.label}</option>
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
              {['EN_ATTENTE', 'EN_COURS', 'TERMINE'].map((statut, index) => (
                <option key={index} value={statut}>
                  {statut.replace('_', ' ').toLowerCase()}
                </option>
              ))}
            </select>

            <select
              className="dropdown-filter"
              value={selectedNature}
              onChange={(e) => {
                setSelectedNature(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Toutes les natures</option>
              <option value="Stage de Fin d Etude">Stage de fin d'étude</option>
              <option value="Stage de recherche">Stage de recherche</option>
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
                  <th>Date Début</th>
                  <th>Date Fin</th>
                  <th>Statut</th>
                  <th>Nature</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentStages.length > 0 ? (
                  currentStages.map(stage => (
                    <tr key={stage._id}>
                      <td>{stage.sujet || 'Non spécifié'}</td>
                      <td>
                        {stage.etudiant?.utilisateur?.nom 
                          ? `${stage.etudiant.utilisateur.nom} ${stage.etudiant.utilisateur.prenom}`
                          : stage.etudiant?.nom
                            ? `${stage.etudiant.nom} ${stage.etudiant.prenom || ''}`
                            : stage.etudiant?.name
                              ? stage.etudiant.name
                              : 'Non assigné'}
                      </td>
                      
                      <td>{formatDate(stage.dateDebut)|| 'Non spécifié'}</td>
                      <td>{formatDate(stage.dateFin)|| 'Non spécifié'}</td>
                      <td>
                        {stage.statut?.replace('_', ' ').toLowerCase()}
                      </td>
                      <td>{formatNatureDisplay(stage.nature)|| 'Non spécifié'}</td>
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

                        <Tippy content="Supprimer">
                          <button 
                            className="Supprimer" 
                            onClick={() => handleDeleteStage(stage._id)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </Tippy>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="no-results">
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

          <div className="add-student-button-container">
            <button 
              className="add-student-button" 
              onClick={() => setShowAddModal(true)}
            >
              <i className="fas fa-plus"></i> Ajouter un nouveau stage
            </button>
          </div>

          {showAddModal && (
            <AjouterStage
              onClose={() => setShowAddModal(false)}
              onAddStage={handleAddStage}
              etudiants={etudiantOptions}
              encadrantUnivOptions={encadrantUnivOptions}
              encadrantProOptions={encadrantProOptions}
            />
          )}

          {showVoirModal && selectedStage && (
            <VoirStage
              stage={selectedStage}
              onClose={() => setShowVoirModal(false)}
            />
          )}

          {showEditModal && selectedStage && (
            <ModifierStage
              stage={selectedStage}
              onClose={() => setShowEditModal(false)}
              onUpdateStage={async (updatedStage) => {
                const result = await handleEditStage(updatedStage);
                if (result) {
                  setStages(prev => prev.map(stage => {
                    if (stage._id === result._id) {
                      // Ensure consistent structure
                      return {
                        ...result,
                        etudiant: result.etudiant || stage.etudiant,
                        encadrantUniv: result.encadrantUniv || stage.encadrantUniv,
                        encadrantPro: result.encadrantPro || stage.encadrantPro
                      };
                    }
                    return stage;
                  }));
                }
                return result;
              }}
              etudiants={etudiantOptions}
              encadrantUnivOptions={encadrantUnivOptions}
              encadrantProOptions={encadrantProOptions}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DisplayStage;
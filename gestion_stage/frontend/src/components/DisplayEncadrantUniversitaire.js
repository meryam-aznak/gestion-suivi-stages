import './style.css';
import Tippy from '@tippyjs/react';
import Swal from 'sweetalert2';
import 'tippy.js/dist/tippy.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from "./Header/Header.js";
import Sidebar from "./SideBar/SideBar.js";
import AjouterEncadrant from './AjouterEncadrantUniversitaire.js';
import VoirEncadrant from './VoirEncadrantUniversitaire.js'; 
import ModifierEncadrant from './ModifierEncadrantUniversitaire.js';

const DisplayEncadrantUniversitaire = () => {
  const [encadrants, setEncadrants] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [filiereOptions, setFiliereOptions] = useState([]);
  const [specialiteOptions, setSpecialiteOptions] = useState([]);
  const [selectedSpecialite, setSelectedSpecialite] = useState('');
  const [selectedFiliere, setSelectedFiliere] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVoirModal, setShowVoirModal] = useState(false);
  const [selectedEncadrant, setSelectedEncadrant] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filieres, setFilieres] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [encadrantsPerPage] = useState(10);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
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
    fetchEncadrants();
    fetchFilieres();
  }, []);

 const fetchEncadrants = () => {
  axios.get('http://localhost:5000/api/encadrantUniversitaire')
    .then(response => {
      setEncadrants(response.data);

      // Get unique filiere names
      const filiereNames = [...new Set(
        response.data
          .filter(e => e.filiere)
          .map(e => e.filiere.nom)
      )];
      setFiliereOptions(filiereNames);

      // Get unique specialites
      const specialites = [...new Set(response.data.map(e => e.specialite))];
      setSpecialiteOptions(specialites);
    })
    .catch(error => {
      console.error('Error fetching encadrants:', error);
    })
    .finally(() => {
      setIsLoading(false);
    });
};


  const fetchFilieres = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/filieres');
      setFilieres(response.data);
    } catch (error) {
      console.error('Error fetching filieres:', error);
    }
    
  };

  const handleAddEncadrant = (newEncadrant) => {
    setEncadrants(prev => [...prev, newEncadrant]);
    
    // Update filiere options if new one was added
    if (newEncadrant.filiere && !filiereOptions.includes(newEncadrant.filiere.nom)) {
      setFiliereOptions(prev => [...prev, newEncadrant.filiere.nom]);
    }
    
    // Update specialite options if new one was added
    if (newEncadrant.specialite && !specialiteOptions.includes(newEncadrant.specialite)) {
      setSpecialiteOptions(prev => [...prev, newEncadrant.specialite]);
    }
    
    setCurrentPage(1); // Reset to first page when adding new encadrant
  };

  const handleEditEncadrant = async (updatedEncadrant) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/encadrantUniversitaire/${updatedEncadrant._id}`,
        updatedEncadrant
      );
      
      setEncadrants(prev => prev.map(encadrant => 
        encadrant._id === updatedEncadrant._id ? response.data : encadrant
      ));
      
      setFiliereOptions(prev => 
        !prev.includes(updatedEncadrant.filiere.nom) ? [...prev, updatedEncadrant.filiere.nom] : prev
      );
      setSpecialiteOptions(prev => 
        !prev.includes(updatedEncadrant.specialite) ? [...prev, updatedEncadrant.specialite] : prev
      );
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour :', error);
      return false;
    }
  };

  const filteredEncadrants = encadrants.filter(encadrant => {
    const fullName = `${encadrant.utilisateur?.nom} ${encadrant.utilisateur?.prenom}`.toLowerCase();
    const matchesSpecialite = selectedSpecialite ? encadrant.specialite === selectedSpecialite : true;
    const matchesFiliere = selectedFiliere ? encadrant.filiere?.nom === selectedFiliere : true;
    const matchesSearch = searchTerm ? fullName.includes(searchTerm.toLowerCase()) : true;
    return matchesSpecialite && matchesFiliere && matchesSearch;
  });

  // Get current encadrants for pagination
  const indexOfLastEncadrant = currentPage * encadrantsPerPage;
  const indexOfFirstEncadrant = indexOfLastEncadrant - encadrantsPerPage;
  const currentEncadrants = filteredEncadrants.slice(indexOfFirstEncadrant, indexOfLastEncadrant);
  const totalPages = Math.ceil(filteredEncadrants.length / encadrantsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const resetFilters = () => {
    setSelectedSpecialite('');
    setSelectedFiliere('');
    setSearchTerm('');
    setCurrentPage(1); // Reset to first page when resetting filters
  };

  const handleDeleteEncadrant = async (encadrantId) => {
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
        await axios.delete(`http://localhost:5000/api/encadrantUniversitaire/${encadrantId}`);
        setEncadrants(prev => prev.filter(encadrant => encadrant._id !== encadrantId));
        
       Swal.fire({
  title: 'Supprimé!',
  text: "L'encadrant a été supprimé.",
  icon: 'success',
  confirmButtonColor: '#3E77B4'
});

      } catch (error) {
        console.error('Error deleting encadrant:', error);
        Swal.fire({
  title: 'Erreur!',
  text: 'La suppression a échoué.',
  icon: 'error',
  confirmButtonColor: '#3E77B4'
});

      }
    }
  };

  return (
    <div className={`app-container ${isSidebarCollapsed ? 'collapsed' : 'expanded'} ${showAddModal ? 'blurred' : ''}`}>
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
        activeItem="university-supervisors"
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
      />

      <div className="main-content">
        <div className="student-container">
          <div className="header-section">
            <h1 className="page-title">Liste Des Encadrants Universitaires</h1>
            <input
              type="text"
              className="search-bar"
              placeholder="Recherche par nom..."
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
              value={selectedSpecialite}
              onChange={(e) => {
                setSelectedSpecialite(e.target.value);
                setCurrentPage(1); // Reset to first page when changing filter
              }}
            >
              <option value="">Toutes les spécialités</option>
              {specialiteOptions.map((specialite, index) => (
                <option key={index} value={specialite}>{specialite}</option>
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
                  <th>Encadrant</th>
                  <th>Spécialité</th>
                  <th>Filière</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentEncadrants.length > 0 ? (
                  currentEncadrants.map(encadrant => (
                    <tr key={encadrant._id}>
                      <td>{encadrant.utilisateur?.nom} {encadrant.utilisateur?.prenom}</td>
                      <td>{encadrant.specialite}</td>
                      <td>{encadrant.filiere?.nom}</td>
                      <td>
                        <Tippy content="Voir les détails">
                          <button className="voir" onClick={() => {
                            setSelectedEncadrant(encadrant);
                            setShowVoirModal(true);
                          }}>
                            <i className="fas fa-eye"></i>
                          </button>
                        </Tippy>

                        <Tippy content="Modifier">
                          <button className="Modifier" onClick={() => {
                            setSelectedEncadrant(encadrant);
                            setShowEditModal(true);
                          }}>
                            <i className="fas fa-edit"></i>
                          </button>
                        </Tippy>

                        <Tippy content="Supprimer">
                          <button 
                            className="Supprimer" 
                            onClick={() => handleDeleteEncadrant(encadrant._id)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </Tippy>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" style={{ textAlign: 'center' }}>Aucun encadrant trouvé.</td></tr>
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
            <button className="add-student-button" onClick={() => setShowAddModal(true)}>
              <i className="fas fa-user-plus"></i> Ajouter Un Encadrant
            </button>
          </div>

          {showAddModal && (
            <AjouterEncadrant
              onClose={() => setShowAddModal(false)}
              onAddEncadrant={handleAddEncadrant}
              filieres={filieres}
            />
          )}

          {showVoirModal && selectedEncadrant && (
            <VoirEncadrant
              encadrant={selectedEncadrant}
              onClose={() => setShowVoirModal(false)}
            />
          )}

          {showEditModal && selectedEncadrant && (
            <ModifierEncadrant
              encadrant={selectedEncadrant}
              onClose={() => setShowEditModal(false)}
              onUpdateEncadrant={async (updatedEncadrant) => {
                const success = await handleEditEncadrant(updatedEncadrant);
                if (success) {
                  setShowEditModal(false);
                }
              }}
              filieres={filieres}
            />
          )}
        </div>
      </div>
          </>
      )}
    </div>
  );
};

export default DisplayEncadrantUniversitaire;
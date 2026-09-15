import './style.css';
import Tippy from '@tippyjs/react';
import Swal from 'sweetalert2';
import 'tippy.js/dist/tippy.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from "./Header/Header.js";
import Sidebar from "./SideBar/SideBar.js";
import AjouterEncadrantPro from './AjouterEncadrantProfessionnel.js';
import VoirEncadrantPro from './VoirEncadrantProfessionnel.js'; 
import ModifierEncadrantPro from './ModifierEncadrantProfessionnel.js';

const DisplayEncadrantProfessionnel = () => {
  const [encadrants, setEncadrants] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [nomOrganismeOptions, setnomOrganismeOptions] = useState([]);
  const [fonctionOptions, setFonctionOptions] = useState([]);
  const [selectedFonction, setSelectedFonction] = useState('');
  const [selectednomOrganisme, setSelectednomOrganisme] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVoirModal, setShowVoirModal] = useState(false);
  const [selectedEncadrant, setSelectedEncadrant] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
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
      if (user.role!='Administrateur') {
                navigate('/PageNonTrouvee');

      }
    }
  }, [navigate]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(userData);
    fetchEncadrants();
  }, []);
useEffect(() => {
  const handleStorageChange = (event) => {
    if (event.key === 'logout') {
      navigate('/login');
    }
  };
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);

  const fetchEncadrants = () => {
    axios.get('http://localhost:5000/api/encadrantProfessionnel')
      .then(response => {
        setEncadrants(response.data);
        const nomOrganismes = [...new Set(response.data.map(e => e.nomOrganisme))];
        setnomOrganismeOptions(nomOrganismes);
        const fonctions = [...new Set(response.data.map(e => e.fonction))];
        setFonctionOptions(fonctions);
      })
       .catch(error => {
      console.error('Error fetching encadrants:', error);
    })
    .finally(() => {
      setIsLoading(false);
    });
  };

  const handleAddEncadrant = (newEncadrant) => {
    setEncadrants(prev => [...prev, newEncadrant]);
    setnomOrganismeOptions(prev => 
      !prev.includes(newEncadrant.nomOrganisme) ? [...prev, newEncadrant.nomOrganisme] : prev
    );
    setFonctionOptions(prev => 
      !prev.includes(newEncadrant.fonction) ? [...prev, newEncadrant.fonction] : prev
    );
    setCurrentPage(1); // Reset to first page when adding new encadrant
  };

  const handleEditEncadrant = async (updatedEncadrant) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/encadrantProfessionnel/${updatedEncadrant._id}`,
        updatedEncadrant
      );
      
      setEncadrants(prev => prev.map(encadrant => 
        encadrant._id === updatedEncadrant._id ? response.data : encadrant
      ));
      
      setnomOrganismeOptions(prev => 
        !prev.includes(updatedEncadrant.nomOrganisme) ? [...prev, updatedEncadrant.nomOrganisme] : prev
      );
      setFonctionOptions(prev => 
        !prev.includes(updatedEncadrant.fonction) ? [...prev, updatedEncadrant.fonction] : prev
      );
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour :', error);
      return false;
    }
  };

  const filteredEncadrants = encadrants.filter(encadrant => {
    const fullName = `${encadrant.utilisateur?.nom} ${encadrant.utilisateur?.prenom}`.toLowerCase();
    const matchesFonction = selectedFonction ? encadrant.fonction === selectedFonction : true;
    const matchesnomOrganisme = selectednomOrganisme ? encadrant.nomOrganisme === selectednomOrganisme : true;
    const matchesSearch = searchTerm ? fullName.includes(searchTerm.toLowerCase()) : true;
    return matchesFonction && matchesnomOrganisme && matchesSearch;
  });

  // Get current encadrants for pagination
  const indexOfLastEncadrant = currentPage * encadrantsPerPage;
  const indexOfFirstEncadrant = indexOfLastEncadrant - encadrantsPerPage;
  const currentEncadrants = filteredEncadrants.slice(indexOfFirstEncadrant, indexOfLastEncadrant);
  const totalPages = Math.ceil(filteredEncadrants.length / encadrantsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const resetFilters = () => {
    setSelectedFonction('');
    setSelectednomOrganisme('');
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
        await axios.delete(`http://localhost:5000/api/encadrantProfessionnel/${encadrantId}`);
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
        activeItem="professional-supervisors"
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
      />

      <div className="main-content">
        <div className="student-container">
          <div className="header-section">
            <h1 className="page-title">Liste Des Encadrants Professionnels</h1>
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
              value={selectedFonction}
              onChange={(e) => {
                setSelectedFonction(e.target.value);
                setCurrentPage(1); // Reset to first page when changing filter
              }}
            >
              <option value="">Toutes les fonctions</option>
              {fonctionOptions.map((fonction, index) => (
                <option key={index} value={fonction}>{fonction}</option>
              ))}
            </select>

            <select
              className="dropdown-filter"
              value={selectednomOrganisme}
              onChange={(e) => {
                setSelectednomOrganisme(e.target.value);
                setCurrentPage(1); // Reset to first page when changing filter
              }}
            >
              <option value="">Toutes les nomOrganismes</option>
              {nomOrganismeOptions.map((nomOrganisme, index) => (
                <option key={index} value={nomOrganisme}>{nomOrganisme}</option>
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
                  <th>Fonction</th>
                  <th>Nom de l'organisme</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentEncadrants.length > 0 ? (
                  currentEncadrants.map(encadrant => (
                    <tr key={encadrant._id}>
                      <td>{encadrant.utilisateur?.nom} {encadrant.utilisateur?.prenom}</td>
                      <td>{encadrant.fonction}</td>
                      <td>{encadrant.nomOrganisme}</td>
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
            <AjouterEncadrantPro
              onClose={() => setShowAddModal(false)}
              onAddEncadrant={handleAddEncadrant}
            />
          )}

          {showVoirModal && selectedEncadrant && (
            <VoirEncadrantPro
              encadrant={selectedEncadrant}
              onClose={() => setShowVoirModal(false)}
            />
          )}

          {showEditModal && selectedEncadrant && (
            <ModifierEncadrantPro
              encadrant={selectedEncadrant}
              onClose={() => setShowEditModal(false)}
              onUpdateEncadrant={async (updatedEncadrant) => {
                const success = await handleEditEncadrant(updatedEncadrant);
                if (success) {
                  setShowEditModal(false);
                }
              }}
            />
          )}
        </div>
      </div>
          </>
      )}
    </div>
  );
};

export default DisplayEncadrantProfessionnel;
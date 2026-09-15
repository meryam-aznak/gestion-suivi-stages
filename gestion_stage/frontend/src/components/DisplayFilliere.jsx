import './style.css';
import Tippy from '@tippyjs/react';
import Swal from 'sweetalert2';
import 'tippy.js/dist/tippy.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from "./Header/Header.js";
import Sidebar from "./SideBar/SideBar.js";
import AjouterFiliere from './AjouterFiliere.jsx';
import ModifierFiliere from './ModifierFiliere.jsx';

const DisplayFiliere = () => {
  const [filieres, setFilieres] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFiliere, setSelectedFiliere] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [filieresPerPage] = useState(10);

  // Calculate filteredFilieres after searchTerm is declared
  const filteredFilieres = filieres.filter(filiere => {
    return searchTerm 
      ? filiere.nom.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
  });

  // Get current filieres for pagination
  const indexOfLastFiliere = currentPage * filieresPerPage;
  const indexOfFirstFiliere = indexOfLastFiliere - filieresPerPage;
  const currentFilieres = filteredFilieres.slice(indexOfFirstFiliere, indexOfLastFiliere);
  const totalPages = Math.ceil(filteredFilieres.length / filieresPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const navigate = useNavigate();

  // Authentication and authorization check
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.role !== 'Administrateur') {
                navigate('/PageNonTrouvee');

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

  // Initial data fetch
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(userData);
    fetchFilieres();
  }, [forceUpdate]);

  const fetchFilieres = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/filieres');
      setFilieres(response.data);
    } catch (error) {
      console.error('Error fetching filieres:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de charger les filières',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFiliere = (newFiliere) => {
    setFilieres(prev => [...prev, newFiliere]);
    setSearchTerm('');
    setCurrentPage(1); // Reset to first page when adding new filiere
    setForceUpdate(prev => prev + 1);
  };

  const handleEditFiliere = async (updatedFiliere) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/filieres/${updatedFiliere._id}`,
        { nom: updatedFiliere.nom }
      );

      if (response.data) {
        setFilieres(prev => 
          prev.map(filiere => 
            filiere._id === updatedFiliere._id ? response.data.filiere : filiere
          )
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Update error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error.response?.data?.message || 'Échec de la mise à jour',
      });
      return false;
    }
  };

  const handleDeleteFiliere = async (filiereId) => {
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
        await axios.delete(`http://localhost:5000/api/filieres/${filiereId}`);
        setFilieres(prev => prev.filter(filiere => filiere._id !== filiereId));
        Swal.fire({
  title: 'Supprimé!',
  text: "La filière a été supprimée.",
  icon: 'success',
  confirmButtonColor: '#3E77B4'
});

      } catch (error) {
        console.error('Error deleting filiere:', error);
        Swal.fire(
          'Erreur!',
          error.response?.data?.message || 'La suppression a échoué. Cette filière est peut-être utilisée par des étudiants.',
          'error'
        );
      }
    }
  };

  return (
    <div className={`app-container ${isSidebarCollapsed ? 'collapsed' : 'expanded'} ${showAddModal || showEditModal ? 'blurred' : ''}`}>
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
            activeItem="fields"
            isSidebarCollapsed={isSidebarCollapsed}
            setIsSidebarCollapsed={setIsSidebarCollapsed}
          />

          <div className="main-content">
            <div className="student-container">
              <div className="header-section">
                <h1 className="page-title">Liste Des Filières</h1>
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

              <div className="table-wrapper">
                <table className="student-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Date de création</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentFilieres.length > 0 ? (
                      currentFilieres.map(filiere => (
                        <tr key={filiere._id}>
                          <td>{filiere.nom}</td>
                          <td>{new Date(filiere.createdAt).toLocaleDateString()}</td>
                          <td>
                            <Tippy content="Modifier">
                              <button className="Modifier" onClick={() => {
                                setSelectedFiliere(filiere);
                                setShowEditModal(true);
                              }}>
                                <i className="fas fa-edit"></i>
                              </button>
                            </Tippy>

                            <Tippy content="Supprimer">
                              <button 
                                className="Supprimer" 
                                onClick={() => handleDeleteFiliere(filiere._id)}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </Tippy>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="3" style={{ textAlign: 'center' }}>Aucune filière trouvée.</td></tr>
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
                  <i className="fas fa-user-plus"></i> Ajouter Filière
                </button>
              </div>

              {showAddModal && (
                <AjouterFiliere
                  onClose={() => setShowAddModal(false)}
                  onAddFiliere={handleAddFiliere}
                />
              )}

              {showEditModal && selectedFiliere && (
                <ModifierFiliere
                  filiere={selectedFiliere}
                  onClose={() => setShowEditModal(false)}
                  onUpdateFiliere={async (updatedFiliere) => {
                    const success = await handleEditFiliere(updatedFiliere);
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

export default DisplayFiliere;
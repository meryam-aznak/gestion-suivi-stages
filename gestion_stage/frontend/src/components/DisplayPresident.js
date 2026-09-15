import './style.css';
import Tippy from '@tippyjs/react';
import Swal from 'sweetalert2';
import 'tippy.js/dist/tippy.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from "./Header/Header.js";
import Sidebar from "./SideBar/SideBar.js";
import AjouterPresident from './AjouterPresident.js';
import VoirPresident from './VoirPresident.js'; 
import ModifierPresident from './ModifierPresident.js';

const DisplayPresident = () => {
  const [presidents, setPresidents] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVoirModal, setShowVoirModal] = useState(false);
  const [selectedPresident, setSelectedPresident] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [presidentsPerPage] = useState(5);
  const [isLoading, setIsLoading] = useState(true);

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
    fetchPresidents();
  }, []);

  const fetchPresidents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/presidents');
      setPresidents(response.data);
    } catch (error) {
      console.error('Error fetching presidents:', error);
    }finally {
      setIsLoading(false);
    }
  };

  const handleAddPresident = (newPresident) => {
    setPresidents(prev => [...prev, newPresident]);
  };

  const handleEditPresident = async (updatedPresident) => {
    setPresidents(prev =>
      prev.map(p => p._id === updatedPresident._id ? updatedPresident : p)
    );
    return true;
  };

  const handleDeletePresident = async (presidentId) => {
    const result = await Swal.fire({
      title: 'Êtes-vous sûr?',
      text: "Vous ne pourrez pas annuler cette action!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer!',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/presidents/${presidentId}`);
        setPresidents(prev => prev.filter(president => president._id !== presidentId));
        Swal.fire('Supprimé!', 'Le responsable a été supprimé.', 'success');
      } catch (error) {
        console.error('Error deleting president:', error);
        Swal.fire('Erreur!', 'La suppression a échoué.', 'error');
      }
    }
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const filteredPresidents = presidents.filter(president => {
    const fullName = `${president.nom} ${president.prenom}`.toLowerCase();
    return searchTerm ? fullName.includes(searchTerm.toLowerCase()) : true;
  });

  const indexOfLastPresident = currentPage * presidentsPerPage;
  const indexOfFirstPresident = indexOfLastPresident - presidentsPerPage;
  const currentPresidents = filteredPresidents.slice(indexOfFirstPresident, indexOfLastPresident);
  const totalPages = Math.ceil(filteredPresidents.length / presidentsPerPage);

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
        activeItem="responsable"
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
      />

      <div className="main-content">
        <div className="student-container">
          <div className="header-section">
            <h1 className="page-title">Liste Des Responsables</h1>
            <input
              type="text"
              className="search-bar"
              placeholder="Recherche par nom..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="table-wrapper">
            <table className="student-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Rôle</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentPresidents.length > 0 ? (
                  currentPresidents.map(president => (
                    <tr key={president._id}>
                      <td>{president.nom}</td>
                      <td>{president.prenom}</td>
                      <td>{president.email}</td>
                      <td>{president.telephone}</td>
                      <td>{president.role}</td>
                      <td>
                        <Tippy content="Voir les détails">
                          <button className="voir" onClick={() => {
                            setSelectedPresident(president);
                            setShowVoirModal(true);
                          }}>
                            <i className="fas fa-eye"></i>
                          </button>
                        </Tippy>

                        <Tippy content="Modifier">
                          <button className="Modifier" onClick={() => {
                            setSelectedPresident(president);
                            setShowEditModal(true);
                          }}>
                            <i className="fas fa-edit"></i>
                          </button>
                        </Tippy>

                        <Tippy content="Supprimer">
                          <button 
                            className="Supprimer" 
                            onClick={() => handleDeletePresident(president._id)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </Tippy>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" style={{ textAlign: 'center' }}>Aucun responsable trouvé.</td></tr>
                )}
              </tbody>
            </table>
          </div>

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
              <i className="fas fa-user-plus"></i> Ajouter Responsable
            </button>
          </div>

          {showAddModal && (
            <AjouterPresident
              onClose={() => setShowAddModal(false)}
              onAddPresident={handleAddPresident}
            />
          )}

          {showVoirModal && selectedPresident && (
            <VoirPresident
              president={selectedPresident}
              onClose={() => setShowVoirModal(false)}
            />
          )}

          {showEditModal && selectedPresident && (
            <ModifierPresident
              president={selectedPresident}
              onClose={() => setShowEditModal(false)}
              onUpdatePresident={async (updatedPresident) => {
                const success = await handleEditPresident(updatedPresident);
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

export default DisplayPresident;

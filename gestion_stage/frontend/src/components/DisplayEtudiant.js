import './style.css';
import Tippy from '@tippyjs/react';
import Swal from 'sweetalert2';
import 'tippy.js/dist/tippy.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from "./Header/Header.js";
import Sidebar from "./SideBar/SideBar.js";
import AjouterEtudiant from './ajouter-etudiant.js';
import VoirEtudiant from './VoirEtudiant.js'; 
import ModifierEtudiant from './ModifierEtudiant.js';

const DisplayEtudiant = () => {
  const [etudiants, setEtudiants] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [filieres, setFilieres] = useState([]);
  const [promotionOptions, setPromotionOptions] = useState([]);
  const [selectedPromotion, setSelectedPromotion] = useState('');
  const [selectedFiliere, setSelectedFiliere] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVoirModal, setShowVoirModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(10);

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
    fetchFilieres();
    fetchEtudiants();
  }, []);

  const fetchFilieres = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/filieres');
      setFilieres(response.data);
    } catch (error) {
      console.error('Error fetching filieres:', error);
    }
  };

  const fetchEtudiants = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('http://localhost:5000/api/etudiants', {
        params: {
          populate: 'filiere,utilisateur,semestre'
        }
      });
      setEtudiants(response.data);
      const promotions = [...new Set(response.data.map(e => e.promotion))].filter(Boolean);
      setPromotionOptions(promotions);
    } catch (error) {
      console.error('Error fetching etudiants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStudent = (newStudent) => {
    setEtudiants(prev => [...prev, newStudent]);
    if (newStudent.promotion && !promotionOptions.includes(newStudent.promotion)) {
      setPromotionOptions(prev => [...prev, newStudent.promotion]);
    }
    setCurrentPage(1); // Reset to first page when adding new student
  };

  const handleEditStudent = async (updatedStudent) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/etudiants/${updatedStudent._id}`,
        updatedStudent
      );
      
      setEtudiants(prev => prev.map(student => 
        student._id === updatedStudent._id ? response.data : student
      ));
      
      if (updatedStudent.promotion && !promotionOptions.includes(updatedStudent.promotion)) {
        setPromotionOptions(prev => [...prev, updatedStudent.promotion]);
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour :', error);
      return false;
    }
  };

  const filteredEtudiants = etudiants.filter(etudiant => {
    const fullName = `${etudiant.utilisateur?.nom} ${etudiant.utilisateur?.prenom}`.toLowerCase();
    const matchesPromotion = selectedPromotion ? etudiant.promotion === selectedPromotion : true;
    const matchesFiliere = selectedFiliere ? etudiant.filiere?._id === selectedFiliere : true;
    const matchesStatut = selectedStatut ? etudiant.statut === selectedStatut : true;
    const matchesSearch = searchTerm ? fullName.includes(searchTerm.toLowerCase()) : true;
    return matchesPromotion && matchesFiliere && matchesStatut && matchesSearch;
  });

  // Get current students for pagination
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredEtudiants.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredEtudiants.length / studentsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const resetFilters = () => {
    setSelectedPromotion('');
    setSelectedFiliere('');
    setSelectedStatut('');
    setSearchTerm('');
    setCurrentPage(1); // Reset to first page when resetting filters
  };

  const handleDeleteStudent = async (studentId) => {
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
        await axios.delete(`http://localhost:5000/api/etudiants/${studentId}`);
        setEtudiants(prev => prev.filter(student => student._id !== studentId));
        
      
         Swal.fire({
          title: 'Supprimé!',
          text: "L'étudiant a été supprimé.",
          icon: 'success',
          confirmButtonColor: '#3E77B4'
        });
      } catch (error) {
        console.error('Error deleting student:', error);
        Swal.fire(
          'Erreur!',
          'La suppression a échoué.',
          'error'
        );
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
            activeItem="students"
            isSidebarCollapsed={isSidebarCollapsed}
            setIsSidebarCollapsed={setIsSidebarCollapsed}
          />

          <div className="main-content">
            <div className="student-container">
              <div className="header-section">
                <h1 className="page-title">Liste Des Étudiants</h1>
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
                  {filieres.map((filiere) => (
                    <option key={filiere._id} value={filiere._id}>{filiere.nom}</option>
                  ))}
                </select>

                <select
                  className="dropdown-filter"
                  value={selectedStatut}
                  onChange={(e) => {
                    setSelectedStatut(e.target.value);
                    setCurrentPage(1); // Reset to first page when changing filter
                  }}
                >
                  <option value="">Tous les statuts</option>
                  {['EN_STAGE', 'EN_COURS', 'LAUREAT', 'EN_ATTENTE'].map((statut, index) => (
                    <option key={index} value={statut}>{statut.replace('_', ' ').toLowerCase()}</option>
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
                      <th>Étudiant(e)</th>
                      <th>Filière</th>
                      <th>Promotion</th>
                      <th>Statut</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentStudents.length > 0 ? (
                      currentStudents.map(etudiant => (
                        <tr key={etudiant._id}>
                          <td>{etudiant.utilisateur?.nom} {etudiant.utilisateur?.prenom}</td>
                          <td>{etudiant.filiere?.nom}</td>
                          <td>{etudiant.promotion}</td>
                          <td>{etudiant.statut}</td>
                          <td>
                            <Tippy content="Voir les détails">
                              <button className="voir" onClick={() => {
                                setSelectedStudent(etudiant);
                                setShowVoirModal(true);
                              }}>
                                <i className="fas fa-eye"></i>
                              </button>
                            </Tippy>

                            <Tippy content="Modifier">
                              <button className="Modifier" onClick={() => {
                                setSelectedStudent(etudiant);
                                setShowEditModal(true);
                              }}>
                                <i className="fas fa-edit"></i>
                              </button>
                            </Tippy>

                            <Tippy content="Supprimer">
                              <button 
                                className="Supprimer" 
                                onClick={() => handleDeleteStudent(etudiant._id)}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </Tippy>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="5" style={{ textAlign: 'center' }}>Aucun étudiant trouvé.</td></tr>
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
                  <i className="fas fa-user-plus"></i> Ajouter Étudiant
                </button>
              </div>

              {showAddModal && (
                <AjouterEtudiant
                  filieres={filieres}
                  onClose={() => setShowAddModal(false)}
                  onAddStudent={handleAddStudent}
                />
              )}

              {showVoirModal && selectedStudent && (
                <VoirEtudiant
                  etudiant={selectedStudent}
                  onClose={() => setShowVoirModal(false)}
                />
              )}

              {showEditModal && selectedStudent && (
                <ModifierEtudiant
                  etudiant={selectedStudent}
                  filieres={filieres}
                  onClose={() => setShowEditModal(false)}
                  onUpdateStudent={async (updatedStudent) => {
                    const success = await handleEditStudent(updatedStudent);
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

export default DisplayEtudiant;
import './style.css';
import Tippy from '@tippyjs/react';
import Swal from 'sweetalert2';
import 'tippy.js/dist/tippy.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from "./Header/Header.js";
import Sidebar from "./SideBar/SideBar.js";
import EtudiantAffecter from './EtudiantAffecter.js';

const ListEtudiantAffecter = () => {
  const [etudiants, setEtudiants] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [filiereOptions, setFiliereOptions] = useState([]);
  const [promotionOptions, setPromotionOptions] = useState([]);
  const [selectedPromotion, setSelectedPromotion] = useState('');
  const [selectedFiliere, setSelectedFiliere] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showVoirModal, setShowVoirModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [etudiantsPerPage] = useState(10);

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
    fetchEtudiantsEnAttente();
  }, []);

  const fetchEtudiantsEnAttente = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/etudiants/en-attente');
      
      let studentsData = [];
      if (Array.isArray(response.data)) {
        studentsData = response.data;
      } else if (response.data.etudiants && Array.isArray(response.data.etudiants)) {
        studentsData = response.data.etudiants;
      } else {
        throw new Error('Unexpected response format');
      }

      setEtudiants(studentsData);
      
      // Extract unique filières and promotions
      const filieres = [...new Set(studentsData.map(e => e.filiere?.nom).filter(Boolean))];
      const promotions = [...new Set(studentsData.map(e => e.promotion).filter(Boolean))];
      
      setFiliereOptions(filieres);
      setPromotionOptions(promotions);
    } catch (error) {
      console.error('Error fetching students:', error);
      setEtudiants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStudent = (affectedStudentId) => {
    setEtudiants(prevEtudiants => 
      prevEtudiants.filter(etudiant => etudiant._id !== affectedStudentId)
    );
  };

  const filteredEtudiants = Array.isArray(etudiants) ? etudiants.filter(etudiant => {
    const fullName = `${etudiant.utilisateur?.nom || ''} ${etudiant.utilisateur?.prenom || ''}`.toLowerCase();
    const matchesPromotion = selectedPromotion ? etudiant.promotion === selectedPromotion : true;
    const matchesFiliere = selectedFiliere ? etudiant.filiere?.nom === selectedFiliere : true;
    const matchesSearch = searchTerm ? fullName.includes(searchTerm.toLowerCase()) : true;
    return matchesPromotion && matchesFiliere && matchesSearch;
  }) : [];

  // Pagination logic
  const indexOfLastEtudiant = currentPage * etudiantsPerPage;
  const indexOfFirstEtudiant = indexOfLastEtudiant - etudiantsPerPage;
  const currentEtudiants = filteredEtudiants.slice(indexOfFirstEtudiant, indexOfLastEtudiant);
  const totalPages = Math.ceil(filteredEtudiants.length / etudiantsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const resetFilters = () => {
    setSelectedPromotion('');
    setSelectedFiliere('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  return (
    <div className={`app-container ${isSidebarCollapsed ? 'collapsed' : 'expanded'} ${showVoirModal ? 'blurred' : ''}`}>
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
        activeItem="internships"
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
      />

      <div className="main-content">
        <div className="student-container">
          <div className="header-section">
            <h1 className="page-title">Liste des Étudiants à Affecter</h1>
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
            
            <button className="reset-filters" onClick={resetFilters}>
              <i className="fas fa-redo"></i> Réinitialiser
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
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentEtudiants.length > 0 ? (
                      currentEtudiants.map(etudiant => (
                        <tr key={etudiant._id}>
                          <td>{etudiant.utilisateur?.nom} {etudiant.utilisateur?.prenom}</td>
                          <td>{etudiant.filiere?.nom || 'N/A'}</td>
                          <td>{etudiant.promotion || 'N/A'}</td>
                          <td>
                              {etudiant.statut || 'N/A'}
                          </td>
                          <td>
                            <Tippy content="Affecter un encadrant">
                              <button 
                                className="voir" 
                                onClick={() => {
                                  setSelectedStudent(etudiant);
                                  setShowVoirModal(true);
                                }}
                              >
                                <i className="fas fa-user-plus"></i> Affecter
                              </button>
                            </Tippy>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="no-data">
                          {etudiants.length === 0 ? 'Aucun étudiant en attente trouvé' : 'Aucun résultat correspondant aux filtres'}
                        </td>
                      </tr>
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
           
        </div> 
        
      {showVoirModal && selectedStudent && (
        <EtudiantAffecter
          etudiant={selectedStudent}
          onClose={() => setShowVoirModal(false)}
          onUpdateStudent={handleUpdateStudent}
        />
      )}
      </div>
</>
          )}
    </div>
  );
};

export default ListEtudiantAffecter;
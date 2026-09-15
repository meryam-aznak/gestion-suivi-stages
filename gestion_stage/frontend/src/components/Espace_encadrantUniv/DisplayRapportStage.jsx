import Tippy from '@tippyjs/react';
import Swal from 'sweetalert2';
import 'tippy.js/dist/tippy.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../style.css';
import Header from '../Header/Header.js';
import Sidebar from './Sidebar/Sidebar.js';
import ProSidebar from "../Espace_encadrantPro/SideBar/Sidebar.js";

const DisplayRapportStage = () => {
  const [rapports, setRapports] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentEncadrant, setCurrentEncadrant] = useState(null);
  const [promotionOptions, setPromotionOptions] = useState([]);
  const [filiereOptions, setFiliereOptions] = useState([]);
  const [selectedPromotion, setSelectedPromotion] = useState('');
  const [selectedFiliere, setSelectedFiliere] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rapportsPerPage] = useState(10);
  
  const navigate = useNavigate();

  useEffect(() => {
  const checkIfUserStillExists = async () => {
    try {
        let res = null;

        if (currentUser.role === 'EncadrantUniv') {
            res = await axios.get(
                `http://localhost:5000/api/encadrantUniversitaire/utilisateur/${currentUser._id}`,
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );
        } else {
            res = await axios.get(
                `http://localhost:5000/api/encadrantProfessionnel/by-user/${currentUser._id}`,
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );
        }

        // Vous pouvez ajouter ici un check explicite si besoin :
        // if (!res.data || res.status !== 200) throw new Error('User not found');

    } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        Swal.fire({
            icon: 'info',
            title: 'Compte supprimé',
            text: 'Votre compte a été supprimé par l\'administrateur.',
            confirmButtonText: 'OK',
            confirmButtonColor: '#3E77B4',
        }).then(() => {
            navigate('/login');
        });
    }
};


    const interval = setInterval(checkIfUserStillExists, 10000);
    return () => clearInterval(interval);
  }, [currentUser, navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    const user = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(user);
    if (user?.role !== 'EncadrantUniv' && user?.role !== 'EncadrantPro') {
      navigate('/PageNonTrouvee');
    }
  }, [navigate]);

  useEffect(() => {
    if (currentUser) {
      fetchEncadrantData();
    }
  }, [currentUser]);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'logout') {
        navigate('/login');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const fetchEncadrantData = async () => {
    setIsLoading(true);
    try {
      let encadrantResponse;
      let endpoint;

      if (currentUser.role === 'EncadrantUniv') {
        endpoint = `http://localhost:5000/api/encadrantUniversitaire/by-user/${currentUser._id}`;
      } else if (currentUser.role === 'EncadrantPro') {
        endpoint = `http://localhost:5000/api/encadrantProfessionnel/by-user/${currentUser._id}`;
      }

      encadrantResponse = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (encadrantResponse.data.success && encadrantResponse.data.encadrant) {
        const encadrantId = encadrantResponse.data.encadrant._id;
        setCurrentEncadrant(encadrantResponse.data);
        await fetchRapports(encadrantId, currentUser.role);
      }
    } catch (err) {
      console.error("Error fetching encadrant data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRapports = async (encadrantId, role) => {
    try {
      let endpoint;
      if (role === 'EncadrantUniv') {
        endpoint = `http://localhost:5000/api/rapport/encadrant-univ/${encadrantId}`;
      } else if (role === 'EncadrantPro') {
        endpoint = `http://localhost:5000/api/rapport/encadrant-pro/${encadrantId}`;
      }

      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const validRapports = response.data
        .filter(r => r.urlDocument)
        .map(r => ({
          ...r,
          fichier: r.urlDocument,
          dateDepot: r.dateSoumission
        }));
      
      setRapports(validRapports);

      const promotions = [...new Set(validRapports.map(r => r.etudiant?.promotion).filter(Boolean))];
      const filieres = [...new Set(validRapports.map(r => r.etudiant?.filiere).filter(Boolean))];

      setPromotionOptions(promotions);
      setFiliereOptions(filieres);
    } catch (err) {
      console.error("Error fetching rapports:", err);
      Swal.fire('Erreur', 'Impossible de charger les rapports.', 'error');
    }
  };

  const handleDownloadRapport = (rapport) => {
    if (!rapport?.urlDocument) {
      return Swal.fire('Erreur', 'Aucun rapport disponible.', 'error');
    }

    const fileUrl = `http://localhost:5000/${rapport.urlDocument.replace(/\\/g, '/')}`;
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = `rapport-${rapport.etudiant?.utilisateur?.nom}-${rapport.etudiant?.utilisateur?.prenom}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Filter rapports based on search and filters
  const filteredRapports = rapports.filter(r => {
    const fullName = `${r.etudiant?.utilisateur?.nom} ${r.etudiant?.utilisateur?.prenom}`.toLowerCase();
    const matchesSearch = !searchTerm || fullName.includes(searchTerm.toLowerCase());
    const matchesPromotion = !selectedPromotion || r.etudiant?.promotion === selectedPromotion;
    const matchesFiliere = !selectedFiliere || r.etudiant?.filiere === selectedFiliere;
    
    return matchesSearch && matchesPromotion && matchesFiliere;
  });

  // Pagination logic
  const indexOfLastRapport = currentPage * rapportsPerPage;
  const indexOfFirstRapport = indexOfLastRapport - rapportsPerPage;
  const currentRapports = filteredRapports.slice(indexOfFirstRapport, indexOfLastRapport);
  const totalPages = Math.ceil(filteredRapports.length / rapportsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const resetFilters = () => {
    setSelectedPromotion('');
    setSelectedFiliere('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="app-container">
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
      </div>
    );
  }

  return (
    <div className={`app-container ${isSidebarCollapsed ? 'collapsed' : 'expanded'}`}>
      <Header currentUser={currentUser} isSidebarCollapsed={isSidebarCollapsed} />
      
      {currentUser?.role === 'EncadrantUniv' ? (
        <Sidebar activeItem="rapport" isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />
      ) : (
        <ProSidebar activeItem="rapport" isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} />
      )}
      
      <div className="main-content">
        <div className="student-container">
          <div className="header-section">
            <h1 className="page-title">Rapports de Stage</h1>
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
              onChange={e => {
                setSelectedPromotion(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Toutes les promotions</option>
              {promotionOptions.map((p, i) => (
                <option key={`promotion-${i}`} value={p}>{p}</option>
              ))}
            </select>

            <select 
              className="dropdown-filter" 
              value={selectedFiliere} 
              onChange={e => {
                setSelectedFiliere(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Toutes les filières</option>
              {filiereOptions.map((f, i) => (
                <option key={`filiere-${i}`} value={f}>{f}</option>
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
                  <th>Étudiant</th>
                  <th>Filière</th>
                  <th>Promotion</th>
                  <th>Titre</th>
                  <th>Rapport</th>
                  <th>Date de Dépôt</th>
                </tr>
              </thead>
              <tbody>
                {currentRapports.length > 0 ? (
                  currentRapports.map(rapport => (
                    <tr key={rapport._id}>
                      <td>{rapport.etudiant?.utilisateur?.nom} {rapport.etudiant?.utilisateur?.prenom}</td>
                      <td>{rapport.etudiant?.filiere || 'Non spécifié'}</td>
                      <td>{rapport.etudiant?.promotion || 'Non spécifié'}</td>
                      <td>{rapport.titre}</td>
                      <td>
                        <span 
                          onClick={() => handleDownloadRapport(rapport)} 
                          style={{ cursor: 'pointer', color: '#1976d2' }}
                        >
                          <i className="fas fa-expand"></i> Aperçu
                        </span>
                      </td>
                      <td>{new Date(rapport.dateSoumission).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center' }}>
                      Aucun rapport disponible.
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
    </div>
  );
};

export default DisplayRapportStage;
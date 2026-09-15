import './Sidebar.css';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from '../../img/download(1).png';
import '@fortawesome/fontawesome-free/css/all.min.css';

const Sidebar = ({ activeItem, isSidebarCollapsed, setIsSidebarCollapsed }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleNavigation = (itemId) => {
    switch(itemId) {
      case 'dashboard':
        navigate('/DashbordEncadrantPro');
        break;
      case 'convention':
        navigate('/ConventionASigne');
        break;
      case 'rapport':
        navigate('/DisplayRapportStage');
        break;
      case 'evaluation':
        navigate('/EvaluationEtudiant');
        break;
      case 'stage':
        navigate('/StagePro');
        break;
      case 'profil':
        navigate('/MonProfil');
        break;
        case 'etudiant':
        navigate('/EtudiantEncadre');
        break;
      default:
        navigate('/dashboard');
    }
  };

  const menuItems = [
   // { id: 'dashboard', icon: 'fa-tachometer-alt', text: 'Tableau De Bord' }, // Dashboard
    { id: 'etudiant', icon: 'fa-users', text: 'Etudiants Encadrés' }, // Convention (document)
    { id: 'rapport', icon: 'fa-book-open', text: 'Rapport de Stage' }, // Rapport (livre ouvert)
    { id: 'stage', icon: 'fa-business-time', text: 'Stages Encadrés' }, // Lauréat (professionnel)
    { id: 'convention', icon: 'fa-file-contract', text: 'Convention à signer' },

  ];
  
  return (
    <>
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        <i className={`fas ${isSidebarCollapsed ? 'fa-bars' : 'fa-times'}`} />
      </button>

      <div className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <img src={logoImage} alt="University Logo" />
        </div>

        <ul className="sidebar-menu">
          {menuItems.map(item => (
            <li
              key={item.id}
              className={`menu-item ${activeItem === item.id ? 'active' : ''}`}
              onClick={() => handleNavigation(item.id)}
              data-tooltip={item.text}
            >
              <i className={`fas ${item.icon}`} />
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default Sidebar;
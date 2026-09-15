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
        navigate('/dashboardEncadUniv');
        break;
      case 'encadrement':
        navigate('/EtudiantUni');
        break;
      case 'rapport':
        navigate('/DisplayRapportStage');
        break;
      case 'stage':
        navigate('/StageUniv');
        break;
      case 'laureat':
        navigate('/FicheLaureat');
        break;
        case 'convention':
        navigate('/ConventionASigne');
        break;
      default:
        navigate('/StageUniv');
    }
  };

  const menuItems = [
   // { id: 'dashboard', icon: 'fa-tachometer-alt', text: 'Tableau De Bord' }, // Dashboard
    { id: 'encadrement', icon: 'fa-users', text: 'Etudiants Encadrés' }, // Convention (document)
    { id: 'rapport', icon: 'fa-book-open', text: 'Rapports de Stage' }, // Rapport (livre ouvert)
    { id: 'stage', icon: 'fa-business-time', text: 'Stages Encadrés' }, // Évaluation (étoile)
        { id: 'convention', icon: 'fa-file-contract', text: 'Convention à signer' }

    //{ id: 'laureat', icon: 'fa-user-tie', text: 'Fiche Lauréat' }, // Lauréat (professionnel)

     // Profil (cercle avec silhouette)
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
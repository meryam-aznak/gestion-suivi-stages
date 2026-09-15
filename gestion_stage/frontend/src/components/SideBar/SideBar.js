import './SideBar.css';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from '../img/download(1).png';
import '@fortawesome/fontawesome-free/css/all.min.css';

const Sidebar = ({ activeItem, isSidebarCollapsed, setIsSidebarCollapsed }) => {
  const navigate = useNavigate();
  const [expandedItem, setExpandedItem] = useState(null);

  

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleSubmenu = (itemId) => {
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const menuItems = [
    { id: 'dashboard', icon: 'fa-chalkboard-teacher', text: 'Tableau De Bord', path: '/dashboard' },
    { id: 'students', icon: 'fa-users', text: 'Gestion Des Étudiants', path: '/GestionEtudiant' },
    { id: 'university-supervisors', icon: 'fa-chalkboard-teacher', text: 'Gestion Des Encadrants Universitaires', path: '/DisplayEncadrantUniversitaire' },
    { id: 'professional-supervisors', icon: 'fa-briefcase', text: 'Gestion Des Encadrants Professionnels', path: '/DisplayEncadrantProfessionnel' },
{ id: 'responsable', icon: 'fa-user-tie', text: 'Gestion Des Responsables', path: '/DisplayPresident' },

    { id: 'fields', icon: 'fa-graduation-cap', text: 'Gestion Des Filières', path: '/DisplayFilliere' },
    { 
      id: 'internships', 
      icon: 'fa-business-time', 
      text: 'Gestion Des Stages',
      submenu: [
        { id: 'internships-add', icon: 'fa-list-check', text: 'Liste des non affectés', path: '/ListEtudiantAffecter' },
        { id: 'internships-list', icon: 'fa-list', text: 'Liste des Stages', path: '/DisplayStage' },
      ]
    },
        { id: 'agreements', icon: 'fa-file-contract', text: 'Gestion Des Conventions', path: '/DisplayConvention' }
  //  { id: 'graduates', icon: 'fa-award', text: 'Gestion Des Lauréats', path: '/DisplayLauréat' }
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
            <React.Fragment key={item.id}>
              <li
                className={`menu-item ${activeItem === item.id ? 'active' : ''} ${item.submenu ? 'has-submenu' : ''}`}
                onClick={() => item.submenu ? toggleSubmenu(item.id) : handleNavigation(item.path)}
                data-tooltip={item.text}
              >
                <i className={`fas ${item.icon}`} />
                <span>{item.text}</span>
                {item.submenu && (
                  <i className={`fas fa-chevron-${expandedItem === item.id ? 'up' : 'down'} submenu-icon`} />
                )}
              </li>
              
              {item.submenu && expandedItem === item.id && !isSidebarCollapsed && (
                <ul className="submenu">
                  {item.submenu.map(subItem => (
                    <li
                      key={subItem.id}
                      className={`submenu-item ${activeItem === subItem.id ? 'active' : ''}`}
                      onClick={() => handleNavigation(subItem.path)}
                    >
                      <span>{subItem.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </React.Fragment>
          ))}

          
        </ul>
      </div>
    </>
  );
};

export default Sidebar;
import React, { useState, useRef, useEffect } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './Header.css';
import { useNavigate } from 'react-router-dom';

const Header = ({ currentUser, isSidebarCollapsed }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  // Fetch notifications when user changes
  useEffect(() => {
    if (currentUser?._id) {
      fetchNotifications();
      
      // Set up SSE connection for real-time updates
      const eventSource = new EventSource(`http://localhost:5000/api/notifications/stream?userId=${currentUser._id}`);
      
      eventSource.onmessage = (event) => {
        const newNotification = JSON.parse(event.data);
        setNotifications(prev => [newNotification, ...prev]);
      };
      
      return () => {
        eventSource.close();
      };
    }
  }, [currentUser]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/notifications?userId=${currentUser._id}`);
      console.log(currentUser._id);
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`http://localhost:5000/api/notifications/mark-all-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentUser._id }),
      });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };
const getRoleLabel = (role) => {
  switch (role) {
    case 'EncadrantPro':
      return 'Encadrant Professionnel';
    case 'EncadrantUniv':
      return 'Encadrant Universitaire';
    case 'Etudiant':
      return 'Étudiant';
    case 'Administrateur':
      return 'Administrateur';
    default:
      return role || 'Non connecté';
  }
};

  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
    setNotificationOpen(false);
  };

  // Toggle notification visibility
  const toggleNotifications = async () => {
    if (!notificationOpen) {
      await fetchNotifications();
    }
    setNotificationOpen(!notificationOpen);
    setDropdownOpen(false);
    
    // Mark notifications as read when opening
    if (!notificationOpen && notifications.some(n => !n.read)) {
      await markAllAsRead();
    }
  };

  // Close dropdown/notification when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    if (!currentUser || !currentUser.role) return;

    switch (currentUser.role) {
      case 'Etudiant':
        navigate('/etudiant/MonProfil');
        break;
      case 'EncadrantUniv':
        navigate('/encadrantUniv/MonProfil');
        break;
      case 'EncadrantPro':
        navigate('/encadrantPro/MonProfil');
        break;
      case 'Administrateur':
        navigate('/admin/MonProfil');
        break;
      default:
        navigate('/president/MonProfil');
    }
  };

  const handleNotificationClick = (notification) => {
    // Navigate based on notification type
    if (notification.type === 'convention') {
   switch (currentUser.role) {
      case 'Etudiant':
        navigate('/ConventionEtudiant');
        break;
      case 'EncadrantUniv':
        navigate('/ConventionASigne');
        break;
      case 'EncadrantPro':
        navigate('/ConventionASigne');
        break;
      default:
        navigate('/DisplayConventionPresident');
    }    }
       if (notification.type === 'stage') {
   switch (currentUser.role) {
      case 'Etudiant':
        navigate('/monStage');
        break;
      case 'EncadrantUniv':
        navigate('/StageUniv');
        break;
      case 'EncadrantPro':
        navigate('/StagePro');
        break;
      default:
        navigate('/DisplayConventionPresident');
    }    }
    // Close notification dropdown
    setNotificationOpen(false);
  };
const handleLogout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  // Trigger logout event for other tabs
  localStorage.setItem('logout', Date.now());
  navigate('/login');
};

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className={`page-header ${isSidebarCollapsed ? 'no-sidebar' : 'with-sidebar'}`}>
      <div className="user-profile">
        <div className="user-info-left">
          <div className="welcome">Bienvenue,</div>
          <div className="user-name">
            {currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Invité'}
          </div>
        </div>
        <div className="user-info-right">
          <div className="user-roles-stacked">
            <div className="user-nam">
              {currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Invité'}
            </div>
           <div className="user-role">
  {currentUser ? getRoleLabel(currentUser.role) : 'Non connecté'}
</div>

          </div>

          <div className="user-actions">
            {/* Notification Icon */}
            <div className="notification-container" ref={notificationRef}>
              <button className="notification-icon" onClick={toggleNotifications}>
                <i className="fas fa-bell"></i>
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </button>
              
              <div className={`notification-dropdown ${notificationOpen ? 'active' : ''}`}>
                <div className="notification-header">
                  <h4>Notifications</h4>
                  <button onClick={markAllAsRead}>Marquer tout comme lu</button>
                </div>
                <div className="notification-list">
                  {notifications.length > 0 ? (
                    notifications
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .map(notification => (
                        <div 
                          key={notification._id} 
                          className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="notification-item-icon">
                            <i className="fas fa-bell"></i>
                          </div>
                          <div className="notification-item-content">
                            <p>{notification.message}</p>
                            <small>{new Date(notification.createdAt).toLocaleDateString()}</small>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="notification-empty">
                      <i className="far fa-bell-slash"></i>
                      <p>Aucune notification</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Dropdown */}
            <div className="profile-container" ref={dropdownRef}>
              <button className="profile-link" onClick={toggleDropdown}>
                <i className="fas fa-user-circle"></i>
              </button>
              
              <div className={`dropdown-menu ${dropdownOpen ? 'active' : ''}`}>
                <button onClick={handleProfileClick}>
                  <i className="fas fa-user"></i> Mon Profil
                </button>
                <button onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt"></i> Se Déconnecter
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
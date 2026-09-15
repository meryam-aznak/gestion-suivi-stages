import '../style.css';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from "../Header/Header.js";
import Sidebar from "./SideBar/SideBar.js";
import Swal from 'sweetalert2';

const Profilpre = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const navigate = useNavigate();

  const [profileFormData, setProfileFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    adresse: '',
    telephone: '',
  });

  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

 useEffect(() => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || (user.role !== 'Doyen' && user.role !== 'Vice doyen')) {
      navigate('/pageNontrouvee');
      return;
    }
    setCurrentUser(user);
    setProfileFormData({
      nom: user.nom || '',
      prenom: user.prenom || '',
      email: user.email || '',
      adresse: user.adresse || '',
      telephone: user.telephone || '',
    });
  } catch (error) {
    console.error("Erreur parsing user:", error);
    navigate('/login');
  }
}, [navigate]);


  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordFormData(prev => ({ ...prev, [name]: value }));
  };

 const handleProfileSubmit = async (e) => {
  e.preventDefault();
  if (!currentUser) return;

  try {
    const updatedData = {
      nom: profileFormData.nom,
      prenom: profileFormData.prenom,
      telephone: profileFormData.telephone,
      adresse: profileFormData.adresse,
    };

    const response = await axios.put(
      `http://localhost:5000/api/auth/modifier/${currentUser._id}`,
      updatedData,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    if (response.data.user) {
      // Update local storage with new data
      const updatedUser = { ...currentUser, ...response.data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      
      Swal.fire('Succès', 'Profil mis à jour avec succès!', 'success');
    }
  } catch (err) {
    console.error('Erreur:', err);
    Swal.fire({
      title: 'Erreur!',
      text: err.response?.data?.message || 'Une erreur est survenue lors de la modification.',
      icon: 'error',
      confirmButtonText: 'OK',
    });
  }
};

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      Swal.fire('Erreur', 'Les mots de passe ne correspondent pas.', 'error');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:5000/api/auth/update-password',
        {
          userId: currentUser._id,
          currentPassword: passwordFormData.currentPassword,
          newPassword: passwordFormData.newPassword,
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        Swal.fire('Succès', 'Mot de passe mis à jour avec succès!', 'success');
        setPasswordFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setShowPasswordModal(false);
      }
    } catch (err) {
      console.error('Erreur:', err);
      Swal.fire({
        title: 'Erreur!',
        text: err.response?.data?.message || 'Une erreur est survenue lors de la modification du mot de passe.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    }
  };

  return (
    <div className="profile-page"> 
    <div className={`app-container ${isSidebarCollapsed ? 'collapsed' : 'expanded'}`}>
      <Header currentUser={currentUser} isSidebarCollapsed={isSidebarCollapsed} />
      <Sidebar
        activeItem="profil"
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
      />

      <div className="main-content">
        <h1>Mon Profil </h1>
        <form className="add-student-form" onSubmit={handleProfileSubmit}>
          <div className="form-row">
            <div className="form-pair">
              <label>Nom:</label>
              <input 
                type="text" 
                name="nom" 
                value={profileFormData.nom} 
                onChange={handleProfileChange} 
                required 
              />
            </div>
            <div className="form-pair">
              <label>Prénom:</label>
              <input 
                type="text" 
                name="prenom" 
                value={profileFormData.prenom} 
                onChange={handleProfileChange} 
                required 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-pair">
              <label>Email:</label>
              <input 
                type="email" 
                name="email" 
                value={profileFormData.email} 
                readOnly 
              />
            </div>
            <div className="form-pair">
              <label>Téléphone:</label>
              <input 
                type="text" 
                name="telephone" 
                value={profileFormData.telephone} 
                onChange={handleProfileChange} 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-pair">
              <label>Adresse:</label>
              <input 
                type="text" 
                name="adresse" 
                value={profileFormData.adresse} 
                onChange={handleProfileChange} 
              />
            </div>
          </div>

          <div className="password-change-button-container">
            <button 
              type="button" 
              className="change-password-button"
              onClick={() => setShowPasswordModal(true)}
            >
              <i className="fas fa-key"></i> Changer votre mot de passe
            </button>
          </div>

          <div className="submit-button-container">
            <button type="submit" className="submit-button">
              <i className="fas fa-save"></i> Modifier le profil
            </button>
          </div>
        </form>

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="modal-overlay">
            <div className="password-modal">
              <div className="modal-header">
                <h2>Changer le mot de passe</h2>
                <button 
                  className="close-modal" 
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordFormData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                  }}
                >
                  &times;
                </button>
              </div>
              
              <form className="password-form" onSubmit={handlePasswordSubmit}>
                <div className="form-row">
                  <div className="form-pair">
                    <label>Mot de passe actuel:</label>
                    <input 
                      type="password" 
                      name="currentPassword" 
                      value={passwordFormData.currentPassword} 
                      onChange={handlePasswordChange} 
                      required 
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-pair">
                    <label>Nouveau mot de passe:</label>
                    <input 
                      type="password" 
                      name="newPassword" 
                      value={passwordFormData.newPassword} 
                      onChange={handlePasswordChange} 
                      required 
                    />
                  </div>
                  <div className="form-pair">
                    <label>Confirmer le mot de passe:</label>
                    <input 
                      type="password" 
                      name="confirmPassword" 
                      value={passwordFormData.confirmPassword} 
                      onChange={handlePasswordChange} 
                      required 
                    />
                  </div>
                </div>

                <div className="modal-buttons">
                  <button type="submit" className="submit-button">
                    <i className="fas fa-save"></i> Modifier le mot de passe
                  </button>
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordFormData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                    }}
                  >
                    <i className="fas fa-times"></i> Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default Profilpre;
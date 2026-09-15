import '../style.css';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from "../Header/Header.js";
import Sidebar from "./SideBar/Sidebar.js";
import Swal from 'sweetalert2';

const ProfilPro = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [encadrant, setEncadrant] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const navigate = useNavigate();

  const [profileFormData, setProfileFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    adresse: '',
    telephone: '',
    fonction: '',
    raisonSociale: '',
    nomOrganisme: '',
    teleOrganisme: '',
  });

  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(userData);

    const fetchEncadrant = async () => {
  if (userData?._id) {
    try {
      const response = await axios.get(`http://localhost:5000/api/encadrantProfessionnel/by-user/${userData._id}`);
      const encadrantData = response.data.encadrant; 

      setProfileFormData({
        nom: encadrantData.utilisateur?.nom || '',
        prenom: encadrantData.utilisateur?.prenom || '',
        email: encadrantData.utilisateur?.email || '',
        adresse: encadrantData.utilisateur?.adresse || '',
        fonction: encadrantData.fonction || '',
        raisonSociale: encadrantData.raisonSociale || '',
        nomOrganisme: encadrantData.nomOrganisme || '',
        teleOrganisme: encadrantData.teleOrganisme || '',
        telephone: encadrantData.utilisateur?.telephone || '',
      });

      setEncadrant(encadrantData);
    } catch (err) {
      console.error('Erreur lors du chargement du profil:', err);
      Swal.fire('Erreur', 'Impossible de charger le profil', 'error');
    }
  }
};

    fetchEncadrant();
  }, []);

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
  if (!encadrant) return;

  const updatedData = {
    _id: encadrant._id,
    fonction: profileFormData.fonction,
    raisonSociale: profileFormData.raisonSociale,
    nomOrganisme: profileFormData.nomOrganisme,
    teleOrganisme: profileFormData.teleOrganisme,
    utilisateur: {
      _id: encadrant.utilisateur._id,
      nom: profileFormData.nom,
      prenom: profileFormData.prenom,
      telephone: profileFormData.telephone,
      email: profileFormData.email,
      adresse: profileFormData.adresse,
    },
  };

  try {
    const response = await axios.put(`http://localhost:5000/api/encadrantProfessionnel/${encadrant._id}`, updatedData);
    
    // Update the local storage with the new user data
    const updatedUser = {
      ...currentUser,
      nom: profileFormData.nom,
      prenom: profileFormData.prenom,
      telephone: profileFormData.telephone,
      email: profileFormData.email,
      adresse: profileFormData.adresse
    };
    
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser); // This will trigger a re-render
    
    Swal.fire('Succès', 'Profil mis à jour avec succès!', 'success');
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
    
    if (!encadrant) return;
    
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      Swal.fire('Erreur', 'Les mots de passe ne correspondent pas.', 'error');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/auth/update-password', {
        userId: encadrant.utilisateur._id,
        currentPassword: passwordFormData.currentPassword,
        newPassword: passwordFormData.newPassword,
      });

      Swal.fire('Succès', 'Mot de passe mis à jour avec succès!', 'success');
      setPasswordFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordModal(false);
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
        <h1>Mon Profil</h1>
        <form className="add-student-form" onSubmit={handleProfileSubmit}>
          <div className="form-row">
            <div className="form-pair">
              <label>Nom:</label>
              <input type="text" name="nom" value={profileFormData.nom} onChange={handleProfileChange}  />
            </div>
            <div className="form-pair">
              <label>Prénom:</label>
              <input type="text" name="prenom" value={profileFormData.prenom} onChange={handleProfileChange}  />
            </div>
          </div>

          <div className="form-row">
            <div className="form-pair">
              <label>Email:</label>
              <input type="email" name="email" value={profileFormData.email} readOnly />
            </div>
            <div className="form-pair">
              <label>Téléphone:</label>
              <input type="text" name="telephone" value={profileFormData.telephone} onChange={handleProfileChange}  />
            </div>
          </div>

          <div className="form-row">
            <div className="form-pair">
              <label>Fonction:</label>
              <input type="text" name="fonction" value={profileFormData.fonction} onChange={handleProfileChange}  />
            </div>
            <div className="form-pair">
              <label>Raison Sociale:</label>
              <input type="text" name="raisonSociale" value={profileFormData.raisonSociale} onChange={handleProfileChange}  />
            </div>
          </div>

          <div className="form-row">
            <div className="form-pair">
              <label>Nom de L'Organisme:</label>
              <input type="text" name="nomOrganisme" value={profileFormData.nomOrganisme} onChange={handleProfileChange}  />
            </div>
            <div className="form-pair">
              <label>Téléphone de L'Organisme:</label>
              <input type="text" name="teleOrganisme" value={profileFormData.teleOrganisme} onChange={handleProfileChange}  />
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

export default ProfilPro;
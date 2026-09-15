import '../style.css';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from "../Header/Header.js";
import Sidebar from "./Sidebar/Sidebar.js";
import Swal from 'sweetalert2';

const ProfilEtudiant = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [etudiant, setEtudiant] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const navigate = useNavigate();

  const [profileFormData, setProfileFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    adresse: '',
    codeApogee: '',
    telephone: '',
    dateNaissance: '',
    numSecurite: '',
    filiere: '', // Garder pour l'ID si nécessaire
  filiereNom: '', // Ajout pour le nom
    promotion: '',
    statut: '',
  });

  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
useEffect(() => {
    const checkIfUserStillExists = async () => {
        try {
            const res = await axios.get(
                `http://localhost:5000/api/etudiants/utilisateur/${currentUser._id}`,
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );
            if (!res.data || !res.data._id) throw new Error("Étudiant introuvable");
        } catch (err) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            Swal.fire({
                icon: 'info',
                title: 'Compte supprimé',
                text: 'Votre compte a été supprimé par l’administrateur.',
            }).then(() => {
                navigate('/login');
            });
        }
    };

    const interval = setInterval(checkIfUserStillExists, 10000); // vérifie toutes les 10 sec

    return () => clearInterval(interval); // clean up
}, [currentUser, navigate]);
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(userData);

    const fetchEtudiant = async () => {
      if (userData?._id) {
        try {
          const response = await axios.get(`http://localhost:5000/api/etudiants/utilisateur/${userData._id}`, {
        params: { populate: 'filiere' } // Ajoutez ce paramètre pour peupler la filière
      });
          const etudiantData = response.data;

          let formattedDate = '';
          if (etudiantData.dateNaissance) {
            formattedDate = etudiantData.dateNaissance.split('T')[0];
          }

          setProfileFormData({
            nom: etudiantData.utilisateur?.nom || '',
            prenom: etudiantData.utilisateur?.prenom || '',
            email: etudiantData.utilisateur?.email || '',
            adresse: etudiantData.utilisateur?.adresse || '',
            codeApogee: etudiantData.codeApogee || '',
            dateNaissance: formattedDate,
            numSecurite: etudiantData.numSecurite || '',
           filiere: etudiantData.filiere?._id || '', // Garder l'ID
        filiereNom: etudiantData.filiere?.nom || '', // Ajouter le nom
            promotion: etudiantData.promotion || '',
            telephone: etudiantData.utilisateur?.telephone || '',
            statut: etudiantData.statut || '',
          });

          setEtudiant(etudiantData);
        } catch (err) {
          console.error('Erreur lors du chargement du profil:', err);
          Swal.fire('Erreur', 'Impossible de charger le profil', 'error');
        }
      }
    };

    fetchEtudiant();
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
    if (!etudiant) return;

    const updatedData = {
      _id: etudiant._id,
      codeApogee: profileFormData.codeApogee,
      dateNaissance: profileFormData.dateNaissance,
      numSecurite: profileFormData.numSecurite,
      filiere: profileFormData.filiere,
      promotion: profileFormData.promotion,
      statut: profileFormData.statut,
      utilisateur: {
        _id: etudiant.utilisateur._id,
        nom: profileFormData.nom,
        prenom: profileFormData.prenom,
        telephone: profileFormData.telephone,
        email: profileFormData.email,
        adresse: profileFormData.adresse,
      },
    };

    try {
      await axios.put(`http://localhost:5000/api/etudiants/${etudiant._id}`, updatedData);
      const updatedUser = {
      ...currentUser,
      nom: profileFormData.nom,
      prenom: profileFormData.prenom,
      telephone: profileFormData.telephone,
      email: profileFormData.email,
      adresse: profileFormData.adresse
    };
       localStorage.setItem('user', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser); 
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
    
    if (!etudiant) return;
    
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      Swal.fire('Erreur', 'Les mots de passe ne correspondent pas.', 'error');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/auth/update-password', {
        userId: etudiant.utilisateur._id,
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
              <label>Date de Naissance:</label>
              <input type="date" name="dateNaissance" value={profileFormData.dateNaissance} onChange={handleProfileChange}  />
            </div>
            <div className="form-pair">
              <label>Adresse:</label>
              <input type="text" name="adresse" value={profileFormData.adresse} onChange={handleProfileChange}  />
            </div>
          </div>

          <div className="form-row">
            <div className="form-pair">
              <label>Code Apogée:</label>
              <input type="text" name="codeApogee" value={profileFormData.codeApogee} readOnly />
            </div>
            <div className="form-pair">
              <label>Filière:</label>
              <input type="text" name="filiere" value={profileFormData.filiereNom} onChange={handleProfileChange}  />
            </div>
          </div>

          <div className="form-row">
            <div className="form-pair">
              <label>Num Sécurité:</label>
              <input type="text" name="numSecurite" value={profileFormData.numSecurite} onChange={handleProfileChange}  />
            </div>
            <div className="form-pair">
              <label>Promotion:</label>
              <input type="text" name="promotion" value={profileFormData.promotion} onChange={handleProfileChange}  />
            </div>
          </div>

          <div className="form-row">
            <div className="form-pair">
              <label>Statut:</label>
              <select name="statut" value={profileFormData.statut} readOnly>
                <option value="">Choisir un statut</option>
                <option value="EN_STAGE">En stage</option>
                <option value="EN_COURS">En cours</option>
                <option value="LAUREAT">Lauréat</option>
                <option value="EN_ATTENTE">En attente</option>
              </select>
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

export default ProfilEtudiant;
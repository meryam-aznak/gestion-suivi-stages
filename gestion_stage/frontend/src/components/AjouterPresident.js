import './style.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import emailjs from '@emailjs/browser';

const AjouterPresident = ({ onClose, onAddPresident }) => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    adresse: '',
    telephone: '',
    role: 'Doyen' // Default value
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    emailjs.init('EXUGhI5cp4k7w-4AQ');
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const sendEmail = (email, password, nom, prenom) => {
    const templateParams = { email, password, nom, prenom };
    return emailjs.send('service_wtck3n6', 'template_1ubl2dr', templateParams);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const randomPassword = Math.random().toString(36).slice(-8);
  
    try {
      const response = await axios.post('http://localhost:5000/api/presidents', {
        ...formData, 
        password: randomPassword
      });
  
      if (response.data.success) {
        onAddPresident(response.data.president);
        await sendEmail(formData.email, randomPassword, formData.nom, formData.prenom);
        
        Swal.fire({
          title: 'Utilisateur ajouté avec succès!',
          html: `
            <p><i class="fas fa-envelope"></i> Email: <strong>${formData.email}</strong></p>
            <p><i class="fas fa-lock"></i> Mot de passe: <strong>${randomPassword}</strong></p>
            <p><i class="fas fa-user-tag"></i> Rôle: <strong>${formData.role}</strong></p>
          `,
          icon: 'success',
                    confirmButtonColor: '#3E77B4',

          confirmButtonText: 'OK'
        }).then(() => {
          onClose();
        });
      } else {
        throw new Error(response.data.message || 'Erreur lors de l\'ajout');
      }
    } catch (err) {
      console.error('Erreur:', err);
      Swal.fire({
        title: 'Erreur!',
        text: err.response?.data?.message || err.message || 'Erreur lors de l\'ajout',
        icon: 'error',
                  confirmButtonColor: '#3E77B4',

        confirmButtonText: 'OK'
      });
    }
  };

  return (
    <div className={`modal-overlay ${isSidebarCollapsed ? 'collapsed' : 'expanded'} ${showAddModal ? 'blurred' : ''}`}>
      <div className="modal-content">
        <h1>Ajouter Un Nouveau Responsable</h1>
        <form className="add-student-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-pair">
              <label>Nom: <span className="required-star">*</span></label>
              <input 
                type="text" 
                name="nom" 
                value={formData.nom} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-pair">
              <label>Prénom: <span className="required-star">*</span></label>
              <input 
                type="text" 
                name="prenom" 
                value={formData.prenom} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-pair">
              <label>Email: <span className="required-star">*</span></label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-pair">
              <label>Téléphone: <span className="required-star">*</span></label>
              <input 
                type="text" 
                name="telephone" 
                value={formData.telephone} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-pair">
              <label>Adresse: <span className="required-star">*</span></label>
              <input 
                type="text" 
                name="adresse" 
                value={formData.adresse} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-pair">
              <label>Rôle: <span className="required-star">*</span></label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="Doyen">Doyen</option>
                <option value="Vice doyen">Vice Doyen</option>
              </select>
            </div>
          </div>

          <div className="submit-button-container">
            <button type="button" className="cancel-button" onClick={onClose}>
              <i className="fas fa-times"></i> Annuler
            </button>
            <button type="submit" className="submit-button">
              <i className="fas fa-user-plus"></i> Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AjouterPresident;
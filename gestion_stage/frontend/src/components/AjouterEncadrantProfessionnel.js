import './style.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import emailjs from '@emailjs/browser';

const AjouterEncadrantProfessionnel = ({ onClose, onAddEncadrant }) => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    nomOrganisme: '',
    raisonSociale: '',
    teleOrganisme: '',
    fonction: ''
  });

  useEffect(() => {
    emailjs.init('l6w0hkLUMLzB_QeY8');
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const sendEmail = (email, password, nom, prenom) => {
    const templateParams = { email, password, nom, prenom };
    return emailjs.send('service_y3ycx5h', 'template_zgxkcop', templateParams);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const randomPassword = Math.random().toString(36).slice(-8);
  
    try {
      const response = await axios.post('http://localhost:5000/api/encadrantProfessionnel', {
        ...formData, 
        password: randomPassword
      });
  
      if (response.data.success) {
        onAddEncadrant(response.data.encadrant);
        
        await sendEmail(formData.email, randomPassword, formData.nom, formData.prenom);
        
        Swal.fire({
          title: 'Encadrant professionnel ajouté avec succès!',
          html: `
            <p><i class="fas fa-envelope"></i> Email: <strong>${formData.email}</strong></p>
            <p><i class="fas fa-lock"></i> Mot de passe: <strong>${randomPassword}</strong></p>
          `,
          icon: 'success',
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
        confirmButtonText: 'OK',
        confirmButtonColor: '#3E77B4'      });
    }
  };

  return (
    <div className="modal-overlay expanded">
      <div className="modal-content">
        <h1>Ajouter Un Encadrant Professionnel</h1>
        <form className="add-student-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-pair">
              <label>Nom: <span className="required-star">*</span></label>
              <input type="text" name="nom" value={formData.nom} onChange={handleChange} required />
            </div>
            <div className="form-pair">
              <label>Prénom: <span className="required-star">*</span></label>
              <input type="text" name="prenom" value={formData.prenom} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-pair">
              <label>Email: <span className="required-star">*</span></label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="form-pair">
              <label>Téléphone:</label>
              <input type="text" name="telephone" value={formData.telephone} onChange={handleChange}  />
            </div>
          </div>
          <div className="form-row">
          <div className="form-pair">
              <label>Fonction:</label>
              <input type="text" name="fonction" value={formData.fonction} onChange={handleChange}  />
            </div>
            <div className="form-pair">
              <label>Nom de l’organisme:</label>
              <input type="text" name="nomOrganisme" value={formData.nomOrganisme} onChange={handleChange}  />
            </div>
          </div>

          <div className="form-row">
            <div className="form-pair">
              <label>Téléphone de l’organisme:</label>
              <input type="text" name="teleOrganisme" value={formData.teleOrganisme} onChange={handleChange}  />
            </div>
            <div className="form-pair">
              <label>Raison sociale:</label>
              <input type="text" name="raisonSociale" value={formData.raisonSociale} onChange={handleChange}  />
            </div>
          </div>
          <div className="form-row">
            <div className="form-pair">
              <label>Adresse de l’organisme:</label>
              <input type="text" name="adresse" value={formData.adresse} onChange={handleChange}  />
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

export default AjouterEncadrantProfessionnel;
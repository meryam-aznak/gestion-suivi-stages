import './style.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const ModifierPresident = ({ president, onClose, onUpdatePresident }) => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    adresse: '',
    telephone: '',
    role: 'Doyen'
  });

  useEffect(() => {
    if (president) {
      setFormData({
        nom: president.nom || '',
        prenom: president.prenom || '',
        email: president.email || '',
        adresse: president.adresse || '',
        telephone: president.telephone || '',
        role: president.role || 'Doyen'
      });
    }
  }, [president]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const response = await axios.put(
      `http://localhost:5000/api/presidents/${president._id}`,
      formData
    );

    const updatedPresident = response.data.utilisateur; // access the updated user directly
    const success = await onUpdatePresident(updatedPresident);

    if (success !== false) {
      Swal.fire({
        title: 'Responsable modifié avec succès!',
        icon: 'success',
        confirmButtonText: 'OK',
      }).then(() => {
        onClose();
      });
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


  return (
    <div className="modal-overlay expanded">
      <div className="modal-content">
        <h1>Modifier Responsable</h1>
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
              <i className="fas fa-save"></i> Modifier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModifierPresident;
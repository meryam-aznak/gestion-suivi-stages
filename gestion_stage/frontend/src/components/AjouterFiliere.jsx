import './style.css';
import { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const AjouterFiliere = ({ onClose, onAddFiliere }) => {
  const [formData, setFormData] = useState({ nom: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
  
    try {
      const response = await axios.post('http://localhost:5000/api/filieres', formData);
      
      if (response.data) {
        onAddFiliere(response.data);
        Swal.fire({
          title: 'Succès!',
          text: `Filière ajouté avec succès!.`,
          icon: 'success',
          confirmButtonColor: '#3E77B4',
          confirmButtonText: 'OK'
        }).then(() => onClose());
      }
    } catch (err) {
      console.error('Erreur:', err);
      let errorMessage = 'Erreur lors de l\'ajout';
      
      if (err.response) {
        if (err.response.status === 409) {
          errorMessage = 'Une filière avec ce nom existe déjà';
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      }
      
      Swal.fire({
        title: 'Erreur!',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3E77B4'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay expanded">
      <div className="modal-content">
        <h1>Ajouter Une Nouvelle Filière</h1>
        <form className="add-filiere-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-pair full-width">
              <label>Nom de la filière: <span className="required-star">*</span></label>
              <input 
                type="text" 
                name="nom" 
                value={formData.nom} 
                onChange={handleChange} 
                required 
                placeholder="Ex: Génie Informatique"
              />
            </div>
          </div>

          <div className="submit-button-container">
            <button 
              type="button" 
              className="cancel-button" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              <i className="fas fa-times"></i> Annuler
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <><i className="fas fa-spinner fa-spin"></i> En cours...</>
              ) : (
                <><i className="fas fa-plus"></i> Ajouter</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AjouterFiliere;
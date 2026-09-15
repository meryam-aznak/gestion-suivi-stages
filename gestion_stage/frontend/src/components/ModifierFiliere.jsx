import './style.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const ModifierFiliere = ({ filiere, onClose, onUpdateFiliere }) => {
  const [formData, setFormData] = useState({ nom: filiere.nom });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    const updatedFiliere = {
      _id: filiere._id, // Keep the same ID
      nom: formData.nom // Updated name
    };

    const success = await onUpdateFiliere(updatedFiliere);

    if (success) {
      Swal.fire({
        title: 'Succès!',
        text: `Filière "${formData.nom}" mise à jour.`,
        icon: 'success',
        confirmButtonText: 'OK'
      }).then(() => onClose()); // Close only on success
    }
  } catch (err) {
    console.error('Erreur:', err);
    Swal.fire({
      title: 'Erreur!',
      text: err.response?.data?.message || 'Échec de la mise à jour',
      icon: 'error',
      confirmButtonText: 'OK'
    });
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="modal-overlay expanded">
      <div className="modal-content">
        <h1>Modifier Filière</h1>
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
                <><i className="fas fa-save"></i> Enregistrer</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModifierFiliere;
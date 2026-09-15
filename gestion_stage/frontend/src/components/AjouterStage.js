import './style.css';
import { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const AjouterStage = ({ onClose, onAddStage, etudiants, encadrantUnivOptions, encadrantProOptions }) => {
  const [formData, setFormData] = useState({
    sujet: '',
    dateDebut: '',
    dateFin: '',
    statut: 'EN_ATTENTE',
    nature: '',
    Objectifs: '',
    horaire: '',
    etudiant: '',
    encadrantUniv: '',
    encadrantPro: ''
  });

  const [loading, setLoading] = useState(false);
  const [isSidebarCollapsed] = useState(false);

 const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
};

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    // Validate required fields
   
    if (!formData.etudiant || !formData.encadrantUniv) {
      throw new Error('L\'étudiant et l\'encadrant universitaire sont obligatoires');
    }

    if (new Date(formData.dateFin) <= new Date(formData.dateDebut)) {
      throw new Error('La date de fin doit être après la date de début');
    }

    // Prepare data for API
 const stageData = {
      sujet: formData.sujet || null,
      dateDebut: formData.dateDebut || null,
      dateFin: formData.dateFin || null,
      statut: formData.statut || 'EN_ATTENTE',
      nature: formData.nature || null,
      Objectifs: formData.Objectifs || null,
      horaire: formData.horaire || null,
      etudiantId: formData.etudiant,
      encadrantUnivId: formData.encadrantUniv,
      encadrantProId: formData.encadrantPro || null
    };

  const response = await axios.post('http://localhost:5000/api/stage', stageData);
    
    if (response.data.success) {
      // Call onAddStage with the new stage data
      onAddStage(response.data.data);
      
      // Close the modal
      onClose();
    } else {
      throw new Error(response.data.message || 'Erreur lors de l\'ajout du stage');
    }
  } catch (err) {
    console.error('Erreur:', err);
    let errorMessage = err.message;
    
    if (err.response?.data?.errors) {
      errorMessage = Object.values(err.response.data.errors)
        .map(error => error.message)
        .join('\n');
    } else if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    }

    Swal.fire({
      title: 'Erreur!',
      text: errorMessage,
      icon: 'error',
                confirmButtonColor: '#3E77B4',

      confirmButtonText: 'OK'
    });
  } finally {
    setLoading(false);
  }
};

  return (
    <div className={`modal-overlay ${isSidebarCollapsed ? 'collapsed' : 'expanded'}`}>
      <div className="modal-content">
        <h1>Ajouter Un Nouveau Stage</h1>
        <form className="add-student-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-pair">
              <label>Sujet:</label>
              <input 
                type="text" 
                name="sujet" 
                value={formData.sujet} 
                onChange={handleChange} 
                 
              />
            </div>
            <div className="form-pair">
              <label>Nature:</label>
              <select 
                name="nature" 
                value={formData.nature} 
                onChange={handleChange} 
                
              >
                <option value="">Sélectionner une nature</option>
                <option value="Stage de recherche">Stage de recherche</option>
                <option value="Stage de Fin d Etude">Stage de Fin d'Etude</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-pair">
              <label>Date Début:</label>
              <input 
                type="date" 
                name="dateDebut" 
                value={formData.dateDebut} 
                onChange={handleChange} 
                 
              />
            </div>
            <div className="form-pair">
              <label>Date Fin:</label>
              <input 
                type="date" 
                name="dateFin" 
                value={formData.dateFin} 
                onChange={handleChange} 
                 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-pair">
              <label>Statut:</label>
              <select 
                name="statut" 
                value={formData.statut} 
                onChange={handleChange} 
                
              >
                <option value="EN_ATTENTE">En attente</option>
                <option value="EN_COURS">En cours</option>
                <option value="TERMINE">Terminé</option>
                <option value="ANNULE">Annulé</option>
              </select>
            </div>
            <div className="form-pair">
              <label>Horaire (heures/semaine):</label>
              <input 
                type="number" 
                name="horaire" 
                value={formData.horaire} 
                onChange={handleChange}
                min="1"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-pair">
              <label>Objectifs:</label>
              <textarea 
                name="Objectifs" 
                value={formData.Objectifs} 
                onChange={handleChange}
                rows="3"
                
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-pair">
              <label>Étudiant:<span className="required-star">*</span></label>
              {etudiants && etudiants.length > 0 ? (
                <select 
                  name="etudiant" 
                  value={formData.etudiant} 
                  onChange={handleChange} 
                  required
                >
                  <option value="">Sélectionner un étudiant</option>
                  {etudiants.map((etudiant, index) => (
                    <option key={index} value={etudiant.value}>
                      {etudiant.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="no-options">Aucun étudiant disponible</p>
              )}
            </div>
            <div className="form-pair">
              <label>Encadrant Universitaire:<span className="required-star">*</span></label>
              {encadrantUnivOptions && encadrantUnivOptions.length > 0 ? (
                <select 
                  name="encadrantUniv" 
                  value={formData.encadrantUniv} 
                  onChange={handleChange} 
                  required
                >
                  <option value="">Sélectionner un encadrant</option>
                  {encadrantUnivOptions.map((encadrant, index) => (
                    <option key={index} value={encadrant.value}>
                      {encadrant.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="no-options">Aucun encadrant universitaire disponible</p>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-pair">
              <label>Encadrant Professionnel:</label>
              {encadrantProOptions && encadrantProOptions.length > 0 ? (
                <select 
                  name="encadrantPro" 
                  value={formData.encadrantPro} 
                  onChange={handleChange}
                >
                  <option value="">Sélectionner un encadrant</option>
                  {encadrantProOptions.map((encadrant, index) => (
                    <option key={index} value={encadrant.value}>
                      {encadrant.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="no-options">Aucun encadrant professionnel disponible</p>
              )}
            </div>
          </div>
           
          <div className="submit-button-container">
            <button 
              type="button" 
              className="cancel-button" 
              onClick={onClose}
              disabled={loading}
            >
              <i className="fas fa-times"></i> Annuler
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span> Ajout en cours...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-plus"></i>
                  <span> Ajouter</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AjouterStage;
import './style.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const ModifierStage = ({ stage, onClose, onUpdateStage, etudiants, encadrantUnivOptions, encadrantProOptions }) => {
  const [formData, setFormData] = useState({
    sujet: '',
    dateDebut: '',
    dateFin: '',
    statut: '',
    nature: '',
    Objectifs: '',
    horaire: '',
    etudiant: '',
    encadrantUniv: '',
    encadrantPro: ''
  });

  useEffect(() => {
    if (stage) {
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      setFormData({
        sujet: stage.sujet || '',
        dateDebut: formatDateForInput(stage.dateDebut),
        dateFin: formatDateForInput(stage.dateFin),
        statut: stage.statut || 'EN_ATTENTE',
        nature: stage.nature || '',
        Objectifs: stage.Objectifs || '',
        horaire: stage.horaire || '',
        etudiant: stage.etudiant?._id || '',
        encadrantUniv: stage.encadrantUniv?._id || '',
        encadrantPro: stage.encadrantPro?._id || ''
      });
    }
  }, [stage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  const updatedData = {
    sujet: formData.sujet,
    dateDebut: formData.dateDebut,
    dateFin: formData.dateFin,
    statut: formData.statut,
  nature: formData.nature === '' ? null : formData.nature,
    Objectifs: formData.Objectifs,
    horaire: formData.horaire,
    etudiant: formData.etudiant,
    encadrantUniv: formData.encadrantUniv,
    encadrantPro: formData.encadrantPro || null
  };

  try {
    const updatedStage = await onUpdateStage({
      ...stage,
      ...updatedData,
      _id: stage._id
    });

    if (updatedStage) {
      await Swal.fire({
        title: 'Succès!',
        text: 'Stage modifié avec succès',
        icon: 'success',
                        confirmButtonColor: '#3E77B4',

        confirmButtonText: 'OK',
      });
      onClose();
    }
  } catch (err) {
    console.error('Erreur:', err);
    let errorMessage = err.response?.data?.message || err.message || 'Une erreur est survenue';
    
    if (err.response?.data?.errors) {
      errorMessage = Object.values(err.response.data.errors).join('\n');
    }

    await Swal.fire({
      title: 'Erreur!',
      text: errorMessage,
      icon: 'error',
      confirmButtonText: 'OK',
    });
  }
};

  return (
    <div className="modal-overlay expanded">
      <div className="modal-content">
        <h1>Modifier Stage</h1>
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
              <label>Horaire:</label>
              <input 
                type="text" 
                name="horaire" 
                value={formData.horaire} 
                onChange={handleChange} 
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
              <label>Étudiant:</label>
              <select 
                name="etudiant" 
                value={formData.etudiant} 
                onChange={handleChange} 
                required
              >
                <option value="">Sélectionner un étudiant</option>
                {etudiants.map(etudiant => (
                  <option key={etudiant.value} value={etudiant.value}>
                    {etudiant.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-pair">
              <label>Encadrant Universitaire:</label>
              <select 
                name="encadrantUniv" 
                value={formData.encadrantUniv} 
                onChange={handleChange} 
                required
              >
                <option value="">Sélectionner un encadrant</option>
                {encadrantUnivOptions.map(encadrant => (
                  <option key={encadrant.value} value={encadrant.value}>
                    {encadrant.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-pair">
              <label>Encadrant Professionnel:</label>
              <select 
                name="encadrantPro" 
                value={formData.encadrantPro} 
                onChange={handleChange}
              >
                <option value="">Sélectionner un encadrant</option>
                {encadrantProOptions.map(encadrant => (
                  <option key={encadrant.value} value={encadrant.value}>
                    {encadrant.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="submit-button-container">
            <button type="button" className="cancel-button" onClick={onClose}>
              <i className="fas fa-times"></i> Annuler
            </button>
            <button type="submit" className="submit-button">
              <i className="fas fa-save"></i> Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModifierStage;
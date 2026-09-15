import './style.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const ModifierEncadrant = ({ encadrant, onClose, onUpdateEncadrant, filieres }) => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    specialite: '',
    filiere: '',
    numSomme: '',
    etablissement: '',
    universite: '',
  });

  const [loadingFilieres, setLoadingFilieres] = useState(true);

  useEffect(() => {
    fetchFilieres();
  }, []);

  useEffect(() => {
    if (encadrant) {
      setFormData({
        nom: encadrant.utilisateur?.nom || '',
        prenom: encadrant.utilisateur?.prenom || '',
        email: encadrant.utilisateur?.email || '',
        adresse: encadrant.utilisateur?.adresse || '',
        telephone: encadrant.utilisateur?.telephone || '',
        specialite: encadrant.specialite || '',
        filiere: encadrant.filiere?._id || encadrant.filiere || '', // Handle both object and ID
        numSomme: encadrant.numSomme || '',
        etablissement: encadrant.etablissement || '',
        universite: encadrant.universite || ''
      });
    }
  }, [encadrant]);

  const fetchFilieres = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/filieres');
      setLoadingFilieres(false);
    } catch (error) {
      console.error('Error fetching filières:', error);
      setLoadingFilieres(false);
      Swal.fire({
        title: 'Erreur',
        text: 'Impossible de charger la liste des filières',
        icon: 'error'
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const updatedData = {
      _id: encadrant._id,
      specialite: formData.specialite,
      filiere: formData.filiere,
      numSomme: formData.numSomme,
      etablissement: formData.etablissement,
      universite: formData.universite,
      utilisateur: {
        _id: encadrant.utilisateur?._id,
        nom: formData.nom,
        prenom: formData.prenom,
        telephone: formData.telephone,
        email: formData.email,
        adresse: formData.adresse,
      },
    };
  
    try {
      const response = await axios.put(
        `http://localhost:5000/api/encadrantUniversitaire/${encadrant._id}`,
        updatedData
      );

      // Find the complete filiere object
      const selectedFiliere = filieres.find(f => f._id === formData.filiere);
      
      // Create the updated encadrant with complete filiere data
      const updatedEncadrantWithFiliere = {
        ...response.data,
        filiere: selectedFiliere || response.data.filiere
      };

      const success = await onUpdateEncadrant(updatedEncadrantWithFiliere);
  
      if (success !== false) {
        Swal.fire({
          title: 'Encadrant modifié avec succès!',
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
        <h1>Modifier Encadrant Universitaire</h1>
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
              <input type="text" name="telephone" value={formData.telephone} onChange={handleChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-pair">
              <label>Spécialité:</label>
              <input type="text" name="specialite" value={formData.specialite} onChange={handleChange} />
            </div>
            <div className="form-pair">
              <label>Filière:</label>
              {loadingFilieres ? (
                <select disabled>
                  <option>Chargement des filières...</option>
                </select>
              ) : (
                <select 
                  name="filiere" 
                  value={formData.filiere} 
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">Sélectionner une filière</option>
                  {filieres.map(filiere => (
                    <option key={filiere._id} value={filiere._id}>
                      {filiere.nom}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-pair">
              <label>Etablissement:</label>
              <input type="text" name="etablissement" value={formData.etablissement} onChange={handleChange} />
            </div>
            <div className="form-pair">
              <label>Université:</label>
              <input type="text" name="universite" value={formData.universite} onChange={handleChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-pair">
              <label>Numero de Somme: <span className="required-star">*</span></label>
              <input type="text" name="numSomme" value={formData.numSomme} onChange={handleChange} required />
            </div>
            <div className="form-pair">
              <label>Adresse:</label>
              <input type="text" name="adresse" value={formData.adresse} onChange={handleChange} />
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

export default ModifierEncadrant;
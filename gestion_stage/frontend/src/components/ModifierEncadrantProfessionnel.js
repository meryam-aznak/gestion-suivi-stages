import './style.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const ModifierEncadrantProfessionnel = ({ encadrant, onClose, onUpdateEncadrant }) => {
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
    if (encadrant) {
      setFormData({
        nom: encadrant.utilisateur?.nom || '',
        prenom: encadrant.utilisateur?.prenom || '',
        email: encadrant.utilisateur?.email || '',
        adresse: encadrant.utilisateur?.adresse || '',
        nomOrganisme: encadrant.nomOrganisme || '',
        raisonSociale: encadrant.raisonSociale || '',
        teleOrganisme: encadrant.teleOrganisme || '',
        telephone: encadrant.utilisateur?.telephone || '',
        fonction: encadrant.fonction || ''
      });
    }
  }, [encadrant]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const userData = encadrant.utilisateur || {
      _id: encadrant._id,
      nom: formData.nom,
      prenom: formData.prenom,
      email: formData.email
    };
  
    const updatedData = {
      _id: encadrant._id,
      fonction: formData.fonction,
      nomOrganisme: formData.nomOrganisme,
      raisonSociale: formData.raisonSociale,
      teleOrganisme: formData.teleOrganisme,
      utilisateur: {
        _id: userData._id,
        nom: formData.nom,
        prenom: formData.prenom,
        adresse: formData.adresse,
        telephone: formData.telephone,
        email: formData.email,
      },
    };
  
    try {
      const response = await axios.put(
        `http://localhost:5000/api/encadrantProfessionnel/${encadrant._id}`,
        updatedData
      );
  
      const success = await onUpdateEncadrant(response.data);
  
      if (success !== false) {
        Swal.fire({
          title: 'Encadrant professionnel modifié avec succès!',
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
        <h1>Modifier Encadrant Professionnel</h1>
        <form className="add-student-form" onSubmit={handleSubmit}>
        <div className="form-row">
            <div className="form-pair">
              <label>Nom:</label>
              <input type="text" name="nom" value={formData.nom} onChange={handleChange}  />
            </div>
            <div className="form-pair">
              <label>Prénom:</label>
              <input type="text" name="prenom" value={formData.prenom} onChange={handleChange}  />
            </div>
          </div>

          <div className="form-row">
            <div className="form-pair">
              <label>Email:</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange}  />
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
              <i className="fas fa-save"></i> Modifier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModifierEncadrantProfessionnel;
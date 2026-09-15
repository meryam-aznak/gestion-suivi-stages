import React from 'react';
import './style.css';

const VoirPresident = ({ president, onClose }) => {
  if (!president) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h1>Détails du Responsable</h1>
        <div className="student-details">
          <p><strong>Nom :</strong> {president.nom || 'Non spécifié'}</p>
          <p><strong>Prénom :</strong> {president.prenom || 'Non spécifié'}</p>
          <p><strong>Email :</strong> {president.email || 'Non spécifié'}</p>
          <p><strong>Téléphone :</strong> {president.telephone || 'Non spécifié'}</p>
          <p><strong>Adresse :</strong> {president.adresse || 'Non spécifié'}</p>
          <p><strong>Rôle :</strong> {president.role || 'Non spécifié'}</p>
        </div>
        <div className="submit-button-container">
          <button type="button" className="cancel-button" onClick={onClose}>
            <i className="fas fa-times"></i> Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoirPresident;
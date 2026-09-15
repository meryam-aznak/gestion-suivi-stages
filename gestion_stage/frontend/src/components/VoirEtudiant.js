import React from 'react';
import './style.css';

const VoirEtudiant = ({ etudiant, onClose }) => {
  if (!etudiant) return null;

  const { utilisateur, codeApogee, filiere, promotion, statut, dateNaissance, numSecurite, semestre } = etudiant;

  const formatDateOrFallback = (date) => {
    if (!date) return 'Non spécifié';
    try {
      const dateObj = new Date(date);
      // Check if the date is valid and not the epoch (01/01/1970)
      if (isNaN(dateObj.getTime()) || dateObj.getTime() === 0) {
        return 'Non spécifié';
      }
      return dateObj.toLocaleDateString();
    } catch {
      return 'Non spécifié';
    }
  };

  // Helper function to display object properties safely
  const displayObjectOrString = (value) => {
    if (!value) return 'Non spécifié';
    if (typeof value === 'object' && value !== null) {
      return value.nom || 'Non spécifié';
    }
    return value;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h1>Détails de l'étudiant</h1>
        <div className="student-details">
          <p><strong>Nom :</strong> {utilisateur?.nom}</p>
          <p><strong>Prénom :</strong> {utilisateur?.prenom}</p>
          <p><strong>Email :</strong> {utilisateur?.email}</p>
          <p><strong>Téléphone :</strong> {utilisateur?.telephone || 'Non spécifié'}</p>
          <p><strong>Adresse :</strong> {utilisateur?.adresse || 'Non spécifié'}</p>
          <p><strong>Date de Naissance :</strong> {formatDateOrFallback(dateNaissance)}</p>
          <p><strong>Code Apogée :</strong> {codeApogee || 'Non spécifié'}</p>
          <p><strong>Filière :</strong> {displayObjectOrString(filiere)}</p>
          <p><strong>Promotion :</strong> {promotion || 'Non spécifié'}</p>
          <p><strong>Numéro de Sécurité :</strong> {numSecurite || 'Non spécifié'}</p>
          <p><strong>Statut :</strong> {statut || 'Non spécifié'}</p>
          <p><strong>Semestre :</strong> {displayObjectOrString(semestre)}</p>
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

export default VoirEtudiant;

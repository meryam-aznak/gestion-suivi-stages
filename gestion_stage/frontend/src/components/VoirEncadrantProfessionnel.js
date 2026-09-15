import React from 'react';
import './style.css';

const VoirEncadrantProfessionnel = ({ encadrant, onClose }) => {
  if (!encadrant) return null;

  const { utilisateur,fonction,nomOrganisme,raisonSociale,teleOrganisme } = encadrant;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h1>Détails de l'encadrant professionnel</h1>
        <div className="student-details">
          <p><strong>Nom :</strong> {utilisateur?.nom}</p>
          <p><strong>Prénom :</strong> {utilisateur?.prenom}</p>
          <p><strong>Email :</strong> {utilisateur?.email}</p>
          <p><strong>Téléphone :</strong> {utilisateur?.telephone}</p>
          <p><strong>Nom de l’organisme :</strong> {nomOrganisme}</p>
          <p><strong>Raison sociale :</strong> {raisonSociale}</p>
          <p><strong>Téléphone de l’organisme :</strong> {teleOrganisme}</p>
          <p><strong>Fonction :</strong> {fonction}</p>
        </div>
        <div className="add-student-button-container">
          <button className="add-student-button" onClick={onClose}>
            <i className="fas fa-times"></i> Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoirEncadrantProfessionnel;
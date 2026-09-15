import React from 'react';
import './style.css';

const VoirEncadrant = ({ encadrant, onClose }) => {
  if (!encadrant) return null;

  const { utilisateur, specialite, filiere, numSomme, etablissement, universite } = encadrant;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h1>Détails de l'encadrant universitaire</h1>
        <div className="student-details">
          <p><strong>Nom :</strong> {utilisateur?.nom}</p>
          <p><strong>Prénom :</strong> {utilisateur?.prenom}</p>
          <p><strong>Email :</strong> {utilisateur?.email}</p>
          <p><strong>Téléphone :</strong> {utilisateur?.telephone}</p>
          <p><strong>Adresse :</strong> {utilisateur?.adresse}</p>
          <p><strong>Spécialité :</strong> {specialite}</p>
          <p><strong>Filière :</strong> {filiere.nom}</p>
          <p><strong>Numero de Somme :</strong> {numSomme}</p>
          <p><strong>Etablissement :</strong> {etablissement}</p>
          <p><strong>Universite :</strong> {universite}</p>
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

export default VoirEncadrant;
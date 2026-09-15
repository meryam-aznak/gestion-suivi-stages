import React, { useState } from 'react';
import './style.css';

const VoirStage = ({ stage, onClose }) => {
  const [showEvaluationsModal, setShowEvaluationsModal] = useState(false);

  if (!stage) return null;

  const {
    sujet,
    dateDebut,
    dateFin,
    statut,
    nature,
    Objectifs,
    horaire,
    etudiant,
    encadrantUniv,
    encadrantPro,
    convention = [],
    rapport = [],
    evaluation = []
  } = stage;

  const stageConvention = convention[0] || {};
  const stageRapport = rapport[0] || {};
  const stageEvaluations = evaluation || [];

  const univEvaluations = stageEvaluations.filter(e => e.evaluateurModel === 'EncadrantUniversitaire');
  const proEvaluations = stageEvaluations.filter(e => e.evaluateurModel === 'EncadrantProfessionnel');

  const formatDate = (dateString) => {
    if (!dateString) return 'Non spécifié';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatNatureDisplay = (nature) => {
    if (!nature) return 'Non spécifiée';
    const displayMap = {
      'Stage de Fin d Etude': "Stage de fin d'étude",
      'Stage de recherche': 'Stage de recherche'
    };
    return displayMap[nature] || nature;
  };

  const getEtatConventionDisplay = (etat) => {
    const displayMap = {
      'Valide': 'Validée',
      'Non Valide': 'Non validée',
      'En cours': 'En cours de validation'
    };
    return displayMap[etat] || etat || 'Non spécifié';
  };

  const getSignaturesStatus = (convention) => {
    if (!convention) return 'Aucune convention disponible';

    const signatures = [];
    if (convention.encadrantUnivSigne) signatures.push("Encadrant universitaire");
    if (convention.encadrantProSigne) signatures.push("Encadrant professionnel");

    if (signatures.length === 0) return 'Etudiant';
    if (signatures.length === 2) return 'Signée par les trois parties';
    return `Signée par: ${signatures.join(' et ')}`;
  };

  const averageNote = stageEvaluations.length > 0
    ? (stageEvaluations.reduce((sum, item) => sum + parseFloat(item.note || 0), 0) / stageEvaluations.length).toFixed(2)
    : 'Non spécifiée';

  return (
    <div className="modal-overlay">
      {!showEvaluationsModal && (
        <div className="modal-content stage-info-modal">
          <div className="modal-header">
            <h2 className="modal-title">Informations sur le Stage</h2>
          </div>
          <div className="grid-container">

            {/* Stage Info */}
            <div className="info-box">
              <h3><i className="fas fa-file-alt" style={{ marginRight: 8 }}></i>Stage de Master</h3>
              <p><strong>Sujet :</strong> {sujet || 'Non spécifié'}</p>
              <p><strong>Nature :</strong> {formatNatureDisplay(nature)}</p>
              <p><strong>Horaire :</strong> {horaire || 'Non spécifié'}</p>
              <p><strong>Date de début :</strong> {formatDate(dateDebut)}</p>
              <p><strong>Date de fin :</strong> {formatDate(dateFin)}</p>
              <p><strong>Statut :</strong> {statut?.replace('_', ' ') || 'Non spécifié'}</p>
              <p><strong>Objectifs :</strong> {Objectifs || 'Non spécifiés'}</p>
            </div>

            {/* Student Info */}
            <div className="info-box">
              <h3><i className="fas fa-user-graduate" style={{ marginRight: 8 }}></i>Informations d'Étudiant</h3>
              <p><strong>Nom :</strong> {etudiant?.utilisateur?.nom || etudiant?.nom || 'Non assigné'}</p>
              <p><strong>Prénom :</strong> {etudiant?.utilisateur?.prenom || etudiant?.prenom || ''}</p>
              <p><strong>Email :</strong> {etudiant?.utilisateur?.email || etudiant?.email || ''}</p>
              <p><strong>Téléphone :</strong> {etudiant?.utilisateur?.telephone || etudiant?.telephone || ''}</p>
              <p><strong>Promotion :</strong> {etudiant?.utilisateur?.promotion || etudiant?.promotion || ''}</p>
              <p><strong>Filière :</strong> {etudiant?.utilisateur?.filiere?.nom || etudiant?.filiere?.nom || ''}</p>
              {stageEvaluations.length > 0 && (
                <button      className="Modifier"  onClick={() => setShowEvaluationsModal(true)}>
                  <i className="fas fa-star" style={{ marginRight: 8 }}></i>
                  Voir les évaluations
                </button>
              )}
            </div>

            {/* Convention */}
            <div className="info-box">
              <h3><i className="fas fa-file-contract" style={{ marginRight: 8 }}></i>Convention de Stage</h3>
              {convention.length > 0 ? (
                <>
                  <p><strong>État :</strong> {getEtatConventionDisplay(stageConvention.etatConvention)}</p>
                  <p><strong>Signatures :</strong> {getSignaturesStatus(stageConvention)}</p>
                  <p><strong>Date de création :</strong> {formatDate(stageConvention.dateCreation)}</p>
                  {stageConvention.urlDocument && (
                    <p>
                      <strong>Document :</strong>
                      <a  href={`http://localhost:5000${stageConvention.urlDocument}`}  target="_blank" rel="noopener noreferrer" className="document-link">
                        Voir la convention
                      </a>
                    </p>
                  )}
                </>
              ) : (
                <p>Aucune convention disponible</p>
              )}
            </div>

            {/* Rapport */}
            <div className="info-box">
              <h3><i className="fas fa-file-pdf" style={{ marginRight: 8 }}></i>Rapport de Stage</h3>
              {rapport.length > 0 ? (
                <>
                  <p><strong>Titre :</strong> {stageRapport.titre || 'Non spécifié'}</p>
                  <p><strong>Date de soumission :</strong> {formatDate(stageRapport.dateSoumission)}</p>
                  {stageRapport.urlDocument && (
                    <p>
                      <strong>Document :</strong>
                      <a href={`http://localhost:5000/${stageRapport.urlDocument}`} target="_blank" rel="noopener noreferrer" className="document-link">
                        Voir le rapport
                      </a>
                    </p>
                  )}
                </>
              ) : (
                <p>Aucun rapport disponible</p>
              )}
            </div>

            {/* Encadrants */}
            <div className="info-box">
              <h3><i className="fas fa-chalkboard-teacher" style={{ marginRight: 8 }}></i>Encadrant Universitaire</h3>
              <p><strong>Nom :</strong> {encadrantUniv?.utilisateur?.nom || encadrantUniv?.nom || 'Non assigné'}</p>
              <p><strong>Prénom :</strong> {encadrantUniv?.utilisateur?.prenom || encadrantUniv?.prenom || ''}</p>
              <p><strong>Email :</strong> {encadrantUniv?.utilisateur?.email || encadrantUniv?.email || ''}</p>
              <p><strong>Téléphone :</strong> {encadrantUniv?.utilisateur?.telephone || encadrantUniv?.telephone || ''}</p>
              <p><strong>Spécialité :</strong> {encadrantUniv?.utilisateur?.specialite || encadrantUniv?.specialite || ''}</p>
              <p><strong>Filière :</strong> {encadrantUniv?.utilisateur?.filiere?.nom || encadrantUniv?.filiere?.nom || ''}</p>
              <p><strong>Établissement :</strong> {encadrantUniv?.utilisateur?.etablissement || encadrantUniv?.etablissement || ''}</p>
              <p><strong>Université :</strong> {encadrantUniv?.utilisateur?.universite || encadrantUniv?.universite || ''}</p>
            </div>

            <div className="info-box">
              <h3><i className="fas fa-briefcase" style={{ marginRight: 8 }}></i>Encadrant Professionnel</h3>
              <p><strong>Nom :</strong> {encadrantPro?.utilisateur?.nom || encadrantPro?.nom || 'Non assigné'}</p>
              <p><strong>Prénom :</strong> {encadrantPro?.utilisateur?.prenom || encadrantPro?.prenom || ''}</p>
              <p><strong>Email :</strong> {encadrantPro?.utilisateur?.email || encadrantPro?.email || ''}</p>
              <p><strong>Téléphone :</strong> {encadrantPro?.utilisateur?.telephone || encadrantPro?.telephone || ''}</p>
              <p><strong>Fonction :</strong> {encadrantPro?.utilisateur?.fonction || encadrantPro?.fonction || ''}</p>
            </div>

            {/* Organisme */}
            <div className="info-box">
              <h3><i className="fas fa-building" style={{ marginRight: 8 }}></i>Organisme d'accueil</h3>
              <p><strong>Nom d'Organisme :</strong> {encadrantPro?.utilisateur?.nomOrganisme || encadrantPro?.nomOrganisme || ''}</p>
              <p><strong>Téléphone d'Organisme :</strong> {encadrantPro?.utilisateur?.teleOrganisme || encadrantPro?.teleOrganisme || ''}</p>
              <p><strong>Raison Sociale :</strong> {encadrantPro?.utilisateur?.raisonSociale || encadrantPro?.raisonSociale || ''}</p>
            </div>
          </div>

          <div className="submit-button-container">
            <button type="button" className="cancel-button" onClick={onClose}>
              <i className="fas fa-times"></i> Fermer
            </button>
          </div>
        </div>
      )}

{showEvaluationsModal && (
  <div className="modal-content evaluations-modal" role="dialog" aria-modal="true">
    <div className="modal-header">
      <h2 className="modal-title">Évaluations du Stage</h2>
     
    </div>

    <div className="evaluations-sections">
      {/* Professional Evaluations */}
      <div className="evaluation-section pro-evaluations">
        <div className="section-header">
          <h2>
            <i className="fas fa-briefcase" style={{ marginRight: 8 }}></i>
            Évaluations Professionnelles
          </h2>
        </div>
        {proEvaluations.length > 0 ? (
          <div className="evaluation-cards">
            {proEvaluations.map((eva, index) => (
              <div key={`pro-${index}`} className="evaluation-card">
                <div className="card-header">
                  <span className="evaluator-type">Professionnel</span>
                  <span className={`evaluation-note note-${eva.note}`}>{eva.note}</span>
                </div>
                <div className="card-content">
                  <p className="evaluation-comments">{eva.commentaires || 'Aucun commentaire'}</p>
                </div>
                <div className="card-footer">
                  <span className="evaluation-date">
                    {new Date(eva.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                  <div className="evaluator-info">
                    {eva.evaluateur?.utilisateur?.nom
                      ? `${eva.evaluateur.utilisateur.nom} ${eva.evaluateur.utilisateur.prenom}`
                      : eva.evaluateur?.nom
                        ? `${eva.evaluateur.nom} ${eva.evaluateur.prenom || ''}`
                        : 'Non spécifié'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-evaluations">
            <i className="fas fa-info-circle"></i>
            <p>Aucune évaluation professionnelle trouvée.</p>
          </div>
        )}
      </div>

      {/* University Evaluations */}
      <div className="evaluation-section uni-evaluations">
        <div className="section-header">
          <h2>
            <i className="fas fa-chalkboard-teacher" style={{ marginRight: 8 }}></i>
            Évaluations Universitaires
          </h2>
        </div>
        {univEvaluations.length > 0 ? (
          <div className="evaluation-cards">
            {univEvaluations.map((eva, index) => (
              <div key={`uni-${index}`} className="evaluation-card">
                <div className="card-header">
                  <span className="evaluator-type">Universitaire</span>
                  <span className={`evaluation-note note-${eva.note}`}>{eva.note}</span>
                </div>
                <div className="card-content">
                  <p className="evaluation-comments">{eva.commentaires || 'Aucun commentaire'}</p>
                </div>
                <div className="card-footer">
                  <span className="evaluation-date">
                    {new Date(eva.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-evaluations">
            <i className="fas fa-info-circle"></i>
            <p>Aucune évaluation universitaire trouvée.</p>
          </div>
        )}
      </div>
    </div>

    <div className="submit-button-container">
      <button type="button" className="cancel-button" onClick={() => setShowEvaluationsModal(false)}>
        <i className="fas fa-times"></i> Fermer
      </button>
    </div>
  </div>
)}
    </div>
  );
};

export default VoirStage;

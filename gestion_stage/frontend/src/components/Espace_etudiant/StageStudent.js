import '../style.css';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from "../Header/Header.js";
import Sidebar from "./Sidebar/Sidebar.js";
import Swal from 'sweetalert2';

const StageStudent = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [stage, setStage] = useState(null);
  const [convention, setConvention] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  // Authentication check
  useEffect(() => {
      const checkIfUserStillExists = async () => {
          try {
              const res = await axios.get(
                  `http://localhost:5000/api/etudiants/utilisateur/${currentUser._id}`,
                  {
                      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                  }
              );
              if (!res.data || !res.data._id) throw new Error("Étudiant introuvable");
          } catch (err) {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              Swal.fire({
                  icon: 'info',
                  title: 'Compte supprimé',
                  text: 'Votre compte a été supprimé par l’administrateur.',
              }).then(() => {
                  navigate('/login');
              });
          }
      };
  
      const interval = setInterval(checkIfUserStillExists, 10000); // vérifie toutes les 10 sec
  
      return () => clearInterval(interval); // clean up
  }, [currentUser, navigate]);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
    if (token) {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user.role !== 'Etudiant') {
        Swal.fire({
          icon: 'error',
          title: 'Accès refusé',
          text: 'Vous n\'êtes pas autorisé à accéder à cette page.',
        }).then(() => {
          navigate('/login');
        });
      }
    }
  }, [navigate]);

  // Fetch student data
  useEffect(() => {
    const fetchData = async () => {
      const userData = JSON.parse(localStorage.getItem("user"));
      setCurrentUser(userData);

      try {
        if (userData?._id) {
          const studentResponse = await axios.get(
            `http://localhost:5000/api/etudiants/utilisateur/${userData._id}`
          );
          setStudentId(studentResponse.data._id);
        }
      } catch (error) {
        console.error("Error fetching student data:", error);
        setError("Error fetching student data");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch stage and convention data
  useEffect(() => {
    const fetchStageData = async () => {
      if (!studentId) return;
      
      setLoading(true);
      try {
        const stageResponse = await axios.get(
          `http://localhost:5000/api/stage/etudiant/${studentId}`,
          {
            params: {
              populate: 'etudiant.filiere,etudiant.utilisateur,encadrantPro.utilisateur,encadrantUniv.utilisateur'
            }
          }
        );
        
        if (stageResponse.data.success) {
          setStage(stageResponse.data.data);
          
          const conventionResponse = await axios.get(
            `http://localhost:5000/api/conventions/etudiant/${studentId}`
          );
          
          if (conventionResponse.data) {
            setConvention(conventionResponse.data);
          }
        } else {
          setStage(null);
          setConvention(null);
        }
      } catch (error) {
        console.error("Error fetching stage data:", error);
        if (error.response?.status !== 404) {
          setError(error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStageData();
  }, [studentId]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const handleUploadConvention = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      await Swal.fire({
        icon: 'error',
        title: 'Format incorrect',
        text: 'Seuls les fichiers PDF sont acceptés',
      });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      await Swal.fire({
        icon: 'error',
        title: 'Fichier trop volumineux',
        text: 'La taille maximale est de 5MB',
      });
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('fichier', file);
      
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      };
      
      let response;
      if (convention) {
        response = await axios.put(
          `http://localhost:5000/api/conventions/${convention._id}`,
          formData,
          config
        );
      } else {
        formData.append('etudiant', studentId);
        response = await axios.post(
          'http://localhost:5000/api/conventions',
          formData,
          config
        );
      }
      
      if (response.data.success) {
        setConvention(response.data.data);
        await Swal.fire({
          title: 'Succès!',
          text: 'Convention téléchargée avec succès',
          icon: 'success',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error("Error uploading convention:", error);
      await Swal.fire({
        title: 'Erreur!',
        text: 'Une erreur est survenue lors du téléchargement',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  if (loading) {
    return <div className="app-container">
      <div className="main-content">
        <div className="loader-container">
          <div id="wifi-loader">
            <svg className="circle-outer" viewBox="0 0 86 86">
              <circle className="back" cx="43" cy="43" r="40"></circle>
              <circle className="front" cx="43" cy="43" r="40"></circle>
              <circle className="new" cx="43" cy="43" r="40"></circle>
            </svg>
            <svg className="circle-middle" viewBox="0 0 60 60">
              <circle className="back" cx="30" cy="30" r="27"></circle>
              <circle className="front" cx="30" cy="30" r="27"></circle>
            </svg>
            <svg className="circle-inner" viewBox="0 0 34 34">
              <circle className="back" cx="17" cy="17" r="14"></circle>
              <circle className="front" cx="17" cy="17" r="14"></circle>
            </svg>
            <div className="text" data-text="Chargement"></div>
          </div>
        </div>
      </div>
    </div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className={`app-container ${isSidebarCollapsed ? 'collapsed' : 'expanded'}`}>
      <Header currentUser={currentUser} isSidebarCollapsed={isSidebarCollapsed} />
      <Sidebar
        activeItem="stage"
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
      />

      <div className="main-content">
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)} className="dismiss-error">
              ×
            </button>
          </div>
        )}

        <div className="student-container">
          <div className="page-title-container">
  <h1 className="page-title-stage">Mon Stage</h1>
</div>
          {stage ? (
            
            <div className="stage-details-container"style={{ marginTop: -40 }}>
              
              
              
              
              <div className="info-boxes-grid">
                {/* Stage Information Box */}
                <div className="info-box">
                  <h3>
                    <i className="fas fa-file-alt" style={{ marginRight: 8 }}></i>
                    Stage de Master
                  </h3>
                  <p><strong>Sujet :</strong> {stage.sujet || 'Non spécifié'}</p>
                  <p><strong>Date de début :</strong> {formatDate(stage.dateDebut)}</p>
                  <p><strong>Date de fin :</strong> {formatDate(stage.dateFin)}</p>
                  <p>
                    <strong>Statut :</strong> 
                    <span className={`status-badge ${stage.statut?.toLowerCase().replace('_', '-')}`}>
                      {stage.statut?.replace('_', ' ').toLowerCase()}
                    </span>
                  </p>
                  <p><strong>Nature :</strong> {stage.nature || 'Non spécifiée'}</p>
                  <p><strong>Objectifs :</strong> {stage.Objectifs || 'Non spécifiés'}</p>
                  {convention ? (
                    <>
                      <p>
                        <strong>État : </strong> 
                        <span className={`convention-status ${convention.etatConvention?.toLowerCase().replace('_', '-')}`}>
                          {convention.etatConvention?.replace('_', ' ').toLowerCase()}
                        </span>
                      </p>
                      {convention.fichier && (
                        <p>
                          <strong>Document : </strong> 
                          <a 
                            href={`http://localhost:5000${convention.fichier}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="document-link"
                          >
                            <i className="fas fa-file-pdf"></i> Voir la convention
                          </a>
                        </p>
                      )}
                      {convention.etatConvention === 'REJETEE' && convention.commentaire && (
                        <p>
                          <strong>Commentaire :</strong> {convention.commentaire}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="convention-upload">
                      <p>Aucune convention n'a été déposée</p>
                      <label className="upload-button">
                        <input 
                          type="file" 
                          onChange={handleUploadConvention} 
                          accept=".pdf" 
                          style={{ display: 'none' }} 
                        />
                        <i className="fas fa-upload"></i> Télécharger la convention
                      </label>
                    </div>
                  )}
                </div>

                {/* University Supervisor Box */}
                <div className="info-box">
                  <h3>
                    <i className="fas fa-chalkboard-teacher" style={{ marginRight: 8 }}></i>
                    Encadrant Universitaire
                  </h3>
                  <p><strong>Nom :</strong> {stage.encadrantUniv?.utilisateur?.nom || stage.encadrantUniv?.nom || 'Non assigné'}</p>
                  <p><strong>Prénom :</strong> {stage.encadrantUniv?.utilisateur?.prenom || stage.encadrantUniv?.prenom || ''}</p>
                  <p><strong>Email :</strong> {stage.encadrantUniv?.utilisateur?.email || stage.encadrantUniv?.email || ''}</p>
                  <p><strong>Téléphone :</strong> {stage.encadrantUniv?.utilisateur?.telephone || stage.encadrantUniv?.telephone || '-'}</p>
                  <p><strong>Spécialité :</strong> {stage.encadrantUniv?.specialite || '-'}</p>
                  <p><strong>Filière :</strong> {stage.encadrantUniv?.filiere?.nom || '-'}</p>
                  <p><strong>Etablissement :</strong> {stage.encadrantUniv?.etablissement || '-'}</p>
                  <p><strong>Université :</strong> {stage.encadrantUniv?.universite || '-'}</p>
                </div>

                {/* Professional Supervisor Box */}
                <div className="info-box">
                  <h3>
                    <i className="fas fa-briefcase" style={{ marginRight: 8 }}></i>
                    Encadrant Professionnel
                  </h3>
                  <p><strong>Nom :</strong> {stage.encadrantPro?.utilisateur?.nom || stage.encadrantPro?.nom || 'Non assigné'}</p>
                  <p><strong>Prénom :</strong> {stage.encadrantPro?.utilisateur?.prenom || stage.encadrantPro?.prenom || ''}</p>
                  <p><strong>Email :</strong> {stage.encadrantPro?.utilisateur?.email || stage.encadrantPro?.email || ''}</p>
                  <p><strong>Téléphone :</strong> {stage.encadrantPro?.utilisateur?.telephone || stage.encadrantPro?.telephone || '-'}</p>
                  <p><strong>Fonction :</strong> {stage.encadrantPro?.fonction || '-'}</p>
                </div>

                {/* Host Organization Box */}
                <div className="info-box ">
                  <h3>
                    <i className="fas fa-building" style={{ marginRight: 8 }}></i>
                    Organisme d'accueil
                  </h3>
                  <p><strong>Nom D'Organisme :</strong> {stage.encadrantPro?.nomOrganisme || 'Non assigné'}</p>
                  <p><strong>Téléphone D'Organisme :</strong> {stage.encadrantPro?.teleOrganisme || ''}</p>
                  <p><strong>Raison Sociale :</strong> {stage.encadrantPro?.raisonSociale || ''}</p>
                </div>
              </div>
            </div>
          ) : (
             <div className="no-stage-container">
                            <div className="no-stage-message">
                                <h3>Vous n'avez pas encore de stage attribué</h3>
                                <p>Veuillez attendre que l'administrateur vous assigne un stage avant de pouvoir générer une convention.</p>
                            </div>
                        </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StageStudent;
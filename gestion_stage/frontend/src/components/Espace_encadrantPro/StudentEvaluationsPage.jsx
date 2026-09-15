import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import Header from "../Header/Header.js";
import Sidebar from "./SideBar/Sidebar.js";
import '../style.css';
import 'tippy.js/dist/tippy.css';
import Tippy from '@tippyjs/react';
import UniSidebar from "../Espace_encadrantUniv/Sidebar/Sidebar.js";

const StudentEvaluationsPage = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [editingEval, setEditingEval] = useState(null);
  const [evaluationForm, setEvaluationForm] = useState({
    note: '',
    commentaires: '',
    etudiant: studentId,
    evaluateur: '',
    evaluateurModel: ''
  });
  const [proEvaluations, setProEvaluations] = useState([]);
  const [uniEvaluations, setUniEvaluations] = useState([]);
  const [myEvaluations, setMyEvaluations] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");

    const fetchUserData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (user.role === 'EncadrantPro') {
          const encadrantResponse = await axios.get(
            `http://localhost:5000/api/encadrantProfessionnel/by-user/${user._id}`
          );
          user.associatedEncadrant = encadrantResponse.data.encadrant._id;
        } else if (user.role === 'EncadrantUniv') {
          const encadrantResponse = await axios.get(
            `http://localhost:5000/api/encadrantUniversitaire/by-user/${user._id}`
          );
          user.associatedEncadrant = encadrantResponse.data.encadrant._id;
        }

        setCurrentUser(user);

        // Check if user has the right role
        if (user.role !== 'EncadrantPro' && user.role !== 'EncadrantUniv') {
          navigate('/PageNonTrouvee');
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        navigate('/login');
      }
    };

    fetchUserData();
  }, [navigate]);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'logout') {
        navigate('/login');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [evalResponse, studentResponse] = await Promise.all([
          axios.get(`http://localhost:5000/api/evaluations/student/${studentId}`),
          axios.get(`http://localhost:5000/api/etudiants/etu/${studentId}`)
        ]);

        setEvaluations(evalResponse.data);
        setStudent(studentResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId]);

  useEffect(() => {
    if (currentUser && evaluations.length > 0) {
      // Pour encadrant pro: seulement ses propres évaluations pro
      if (currentUser.role === 'EncadrantPro') {
        const myEvals = evaluations.filter(eva => 
          eva.evaluateurModel === 'EncadrantProfessionnel' && 
          eva.evaluateur._id === currentUser.associatedEncadrant
        );
        setMyEvaluations(myEvals);
      }
      // Pour encadrant uni: ses évaluations uni + toutes les évaluations pro
      else if (currentUser.role === 'EncadrantUniv') {
        const myUniEvals = evaluations.filter(eva => 
          eva.evaluateurModel === 'EncadrantUniversitaire' && 
          eva.evaluateur._id === currentUser.associatedEncadrant
        );
        const allProEvals = evaluations.filter(eva => 
          eva.evaluateurModel === 'EncadrantProfessionnel'
        );
        setUniEvaluations(myUniEvals);
        setProEvaluations(allProEvals);
      }
    }
  }, [currentUser, evaluations]);

  useEffect(() => {
    // Set the evaluator model based on user role when component mounts
    if (currentUser) {
      setEvaluationForm(prev => ({
        ...prev,
        evaluateurModel: currentUser.role === 'EncadrantPro' ? 'EncadrantProfessionnel' : 'EncadrantUniversitaire'
      }));
    }
  }, [currentUser]);

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

  const handleEvalChange = (e) => {
    const { name, value } = e.target;
    setEvaluationForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
const handleUpdateEval = async (e) => {
  e.preventDefault();
  try {
    let evaluatorId = '';
    
    if (currentUser.role === 'EncadrantPro') {
      evaluatorId = currentUser.associatedEncadrant;
    } else if (currentUser.role === 'EncadrantUniv') {
      evaluatorId = currentUser.associatedEncadrant;
    }

    const formData = {
      ...evaluationForm,
      evaluateur: evaluatorId
    };

    const response = await axios.put(
      `http://localhost:5000/api/evaluations/${editingEval._id}`,
      formData
    );

    if (response.data && response.data._id) {
      await Swal.fire({
        icon: 'success',
        title: 'Évaluation mise à jour',
        text: 'L\'évaluation a été mise à jour avec succès!',
        confirmButtonColor: '#3E77B4',
        confirmButtonText: 'OK',
      });

      const evalResponse = await axios.get(`http://localhost:5000/api/evaluations/student/${studentId}`);
      setEvaluations(evalResponse.data);
      setShowEvalModal(false);
      setEditingEval(null);
      setEvaluationForm({
        note: '',
        commentaires: '',
        etudiant: studentId,
        evaluateur: '',
        evaluateurModel: currentUser.role === 'EncadrantPro' ? 'EncadrantProfessionnel' : 'EncadrantUniversitaire'
      });
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: error.response?.data?.message || error.message,
    });
  }
};
  const handleEvalSubmit = async (e) => {
    e.preventDefault();
    try {
      let evaluatorId = '';
      
      if (currentUser.role === 'EncadrantPro') {
        evaluatorId = currentUser.associatedEncadrant;
      } else if (currentUser.role === 'EncadrantUniv') {
        evaluatorId = currentUser.associatedEncadrant;
      }

      const formData = {
        ...evaluationForm,
        evaluateur: evaluatorId
      };

      const response = await axios.post(
        'http://localhost:5000/api/evaluations',
        formData
      );

      if (response.data && response.data._id) {
        await Swal.fire({
          icon: 'success',
          title: 'Évaluation enregistrée',
          text: 'L\'évaluation a été enregistrée avec succès!',
          confirmButtonColor: '#3E77B4',
          confirmButtonText: 'OK',
        });

        const evalResponse = await axios.get(`http://localhost:5000/api/evaluations/student/${studentId}`);
        setEvaluations(evalResponse.data);
        setShowEvalModal(false);
        setEvaluationForm({
          note: '',
          commentaires: '',
          etudiant: studentId,
          evaluateur: '',
          evaluateurModel: currentUser.role === 'EncadrantPro' ? 'EncadrantProfessionnel' : 'EncadrantUniversitaire'
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error.response?.data?.message || error.message,
      });
    }
  };

  const handleEditEval = (evaluation) => {
    // Check if the user is allowed to edit this evaluation
    if ((currentUser.role === 'EncadrantPro' && evaluation.evaluateurModel !== 'EncadrantProfessionnel') ||
        (currentUser.role === 'EncadrantUniv' && evaluation.evaluateurModel !== 'EncadrantUniversitaire')) {
      Swal.fire({
        icon: 'error',
        title: 'Action non autorisée',
        text: 'Vous ne pouvez modifier que vos propres évaluations.',
      });
      return;
    }

    setEditingEval(evaluation);
    setEvaluationForm({
      note: evaluation.note,
      commentaires: evaluation.commentaires,
      etudiant: studentId,
      evaluateur: evaluation.evaluateur,
      evaluateurModel: evaluation.evaluateurModel
    });
    setShowEvalModal(true);
  };

  const handleDeleteEval = async (evaluation) => {
    // Check if the user is allowed to delete this evaluation
    if ((currentUser.role === 'EncadrantPro' && evaluation.evaluateurModel !== 'EncadrantProfessionnel') ||
        (currentUser.role === 'EncadrantUniv' && evaluation.evaluateurModel !== 'EncadrantUniversitaire')) {
      Swal.fire({
        icon: 'error',
        title: 'Action non autorisée',
        text: 'Vous ne pouvez supprimer que vos propres évaluations.',
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Êtes-vous sûr?',
      text: "Vous ne pourrez pas annuler cette action!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3E77B4',
      cancelButtonColor: '#cacbcc',
      confirmButtonText: 'Oui, supprimer!',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/evaluations/${evaluation._id}`);
        
        const evalResponse = await axios.get(`http://localhost:5000/api/evaluations/student/${studentId}`);
        setEvaluations(evalResponse.data);
        
        Swal.fire({
          title: 'Supprimé!',
          text: 'L\'évaluation a été supprimée.',
          icon: 'success',
          confirmButtonColor: '#3E77B4',
          confirmButtonText: 'OK'
        });
      } catch (error) {
        console.error('Error deleting evaluation:', error);
        Swal.fire(
          'Erreur!',
          error.response?.data?.message || 'La suppression a échoué.',
          'error'
        );
      }
    }
  };

  return (
    <div className={`app-container ${isSidebarCollapsed ? 'collapsed' : 'expanded'}`}>
      <Header currentUser={currentUser} isSidebarCollapsed={isSidebarCollapsed} />
      {currentUser?.role === 'EncadrantPro' ? (
        <Sidebar
          activeItem="etudiant"
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />
      ) : (
        <UniSidebar 
          activeItem="encadrement"
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />
      )}
      
      <div className="main-content">
        <div className="evaluations-container">
          <div className="header-section">
            <h1 className="page-title">
              Évaluations de {student?.utilisateur?.prenom} {student?.utilisateur?.nom}
            </h1>
          </div>

          <div className="student-info">
            <p><strong>Promotion:</strong> {student?.promotion || '-'}</p>
            <p><strong>Filière:</strong> {student?.filiere?.nom || '-'}</p>
          </div>

          <div className="evaluations-sections">
            {/* Section pour les encadrants pro (seulement leurs évals) */}
            {currentUser?.role === 'EncadrantPro' && (
              <div className="evaluation-section pro-evaluations">
                <div className="section-header">
                  <h2>Mes Évaluations Professionnelles</h2>
                  <div className="section-actions">
                    <button className="add-evaluation-btn small" onClick={() => setShowEvalModal(true)}>
                      <i className="fas fa-plus"></i> Ajouter
                    </button>
                  </div>
                </div>
                {myEvaluations.length > 0 ? (
                  <div className="evaluation-cards">
                    {myEvaluations.map((eva, index) => (
                      <div key={index} className="evaluation-card">
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
                          <div className="evaluation-actions">
                            <Tippy content="Modifier">
                              <button 
                                className="Modifier" 
                                onClick={() => handleEditEval(eva)}
                                title="Modifier"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                            </Tippy>
                            <Tippy content="Supprimer">
                              <button 
                                className="Supprimer" 
                                onClick={() => handleDeleteEval(eva)}
                                title="Supprimer"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </Tippy>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-evaluations">
                    <i className="fas fa-info-circle"></i>
                    <p>Vous n'avez pas encore évalué cet étudiant.</p>
                  </div>
                )}
              </div>
            )}

            {/* Section pour les encadrants uni (leurs évals + évals pro) */}
            {currentUser?.role === 'EncadrantUniv' && (
              <>
                <div className="evaluation-section uni-evaluations">
                  <div className="section-header">
                    <h2>Mes Évaluations Universitaires</h2>
                    <div className="section-actions">
                      <button className="add-evaluation-btn small" onClick={() => setShowEvalModal(true)}>
                        <i className="fas fa-plus"></i> Ajouter
                      </button>
                    </div>
                  </div>
                  {uniEvaluations.length > 0 ? (
                    <div className="evaluation-cards">
                      {uniEvaluations.map((eva, index) => (
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
                            <div className="evaluation-actions">
                              <Tippy content="Modifier">
                                <button 
                                  className="Modifier" 
                                  onClick={() => handleEditEval(eva)}
                                  title="Modifier"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                              </Tippy>
                              <Tippy content="Supprimer">
                                <button 
                                  className="Supprimer" 
                                  onClick={() => handleDeleteEval(eva)}
                                  title="Supprimer"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </Tippy>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-evaluations">
                      <i className="fas fa-info-circle"></i>
                      <p>Vous n'avez pas encore évalué cet étudiant.</p>
                    </div>
                  )}
                </div>

                <div className="evaluation-section pro-evaluations">
                  <div className="section-header">
                    <h2>Évaluations Professionnelles</h2>
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
              </>
            )}
          </div>
        </div>

        {/* Add/Edit Evaluation Modal */}
        {showEvalModal && (
          <div className={`modal-overlay ${isSidebarCollapsed ? 'collapsed' : 'expanded'}`}>
            <div className="modal-content">
              <h1>{editingEval ? 'Modifier l\'Évaluation' : 'Évaluer l\'Étudiant'}</h1>
              <form className="add-student-form" onSubmit={editingEval ? handleUpdateEval : handleEvalSubmit}>
                <div className="form-row">
                  <div className="form-pair">
                    <label>Étudiant: <span className="required-star">*</span></label>
                    <input
                      type="text"
                      value={`${student?.utilisateur?.prenom} ${student?.utilisateur?.nom}`}
                      disabled
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-pair">
                    <label hidden>Type d'évaluation: <span className="required-star">*</span></label>
                    <input
                      type="text"
                      value={currentUser?.role === 'EncadrantPro' ? 'Professionnelle' : 'Universitaire'}
                      disabled
                      hidden
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-pair">
                    <label>Note: <span className="required-star">*</span></label>
                    <select
                      name="note"
                      value={evaluationForm.note}
                      onChange={handleEvalChange}
                      required
                    >
                      <option value="">Sélectionner une note</option>
                      <option value="A">A - Excellent</option>
                      <option value="B">B - Très bien</option>
                      <option value="C">C - Bien</option>
                      <option value="D">D - Satisfaisant</option>
                      <option value="E">E - Échec</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-pair full-width">
                    <label>Commentaires:</label>
                    <textarea
                      name="commentaires"
                      value={evaluationForm.commentaires}
                      onChange={handleEvalChange}
                      rows="4"
                    />
                  </div>
                </div>

                <div className="submit-button-container">
                  <button 
                    type="button" 
                    className="cancel-button" 
                    onClick={() => {
                      setShowEvalModal(false);
                      setEditingEval(null);
                      setEvaluationForm({
                        note: '',
                        commentaires: '',
                        etudiant: studentId,
                        evaluateur: '',
                        evaluateurModel: currentUser?.role === 'EncadrantPro' ? 'EncadrantProfessionnel' : 'EncadrantUniversitaire'
                      });
                    }}
                  >
                    <i className="fas fa-times"></i> Annuler
                  </button>
                  <button type="submit" className="submit-button">
                    <i className="fas fa-save"></i> {editingEval ? 'Mettre à jour' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentEvaluationsPage;
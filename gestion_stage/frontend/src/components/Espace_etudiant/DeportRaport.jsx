import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import Header from "../Header/Header.js";
import Sidebar from "./Sidebar/Sidebar.js";

const DepotRapport = () => {
    const navigate = useNavigate();
    const [currentUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
    const [currentEtudiant, setCurrentEtudiant] = useState(null);
    const [stage, setStage] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [titre, setTitre] = useState('');
    const [depositLoading, setDepositLoading] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [existingRapport, setExistingRapport] = useState(null);
    const [error, setError] = useState(null);

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
                    text: 'Votre compte a été supprimé par l\' administrateur.',
                }).then(() => {
                    navigate('/login');
                });
            }
        };

        const interval = setInterval(checkIfUserStillExists, 10000);
        return () => clearInterval(interval);
    }, [currentUser, navigate]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (currentUser?.role === 'Etudiant') {
                    const etudiantResponse = await axios.get(
                        `http://localhost:5000/api/etudiants/utilisateur/${currentUser._id}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            }
                        }
                    );
                    setCurrentEtudiant(etudiantResponse.data);

                    const stageResponse = await axios.get(
                        `http://localhost:5000/api/stage/etudiant/${etudiantResponse.data._id}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            }
                        }
                    );
                    if (stageResponse.data.length > 0) {
                        setStage(stageResponse.data[0]);
                    }

                    try {
                        const rapportResponse = await axios.get(
                            `http://localhost:5000/api/rapport/etudiant/${etudiantResponse.data._id}`,
                            {
                                headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                                }
                            }
                        );
                        setExistingRapport(rapportResponse.data);
                    } catch (err) {
                        if (err.response?.status !== 404) {
                            console.error("Erreur lors de la récupération du rapport :", err);
                        }
                    }
                }
            } catch (error) {
                console.error("Erreur lors du chargement des données:", error);
                setError('Impossible de charger les données nécessaires');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser, navigate]);

    const handleDeposit = async (e) => {
        e.preventDefault();

        if (!currentEtudiant) {
            setError('Aucun étudiant trouvé');
            return;
        }

        if (!selectedFile || !titre) {
            setError('Veuillez sélectionner un fichier PDF et saisir un titre.');
            return;
        }

        setDepositLoading(true);
        const formData = new FormData();
        formData.append('pdf', selectedFile);
        formData.append('titre', titre);
        formData.append('etudiant', currentEtudiant._id);

        try {
            await axios.post(
                'http://localhost:5000/api/rapport/deposer',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            Swal.fire({
                title: 'Succès',
                text: 'Rapport de stage déposé avec succès.',
                confirmButtonColor: '#3E77B4',
                icon: 'success'
            }).then(() => {
                navigate('/DepotRapport');
            });

        } catch (error) {
            console.error(error);
            setError(error.response?.data?.message || 'Erreur lors du dépôt du rapport');
        } finally {
            setDepositLoading(false);
        }
    };

    if (error) {
        return (
            <div className={`app-container ${isSidebarCollapsed ? 'collapsed' : 'expanded'}`}>
                <Header currentUser={currentUser} isSidebarCollapsed={isSidebarCollapsed} />
                <Sidebar
                    activeItem="rapport"
                    isSidebarCollapsed={isSidebarCollapsed}
                    setIsSidebarCollapsed={setIsSidebarCollapsed}
                />
                <div className="main-container">
                    <div className="main-content">
                            <div className="no-stage-container">
                            <div className="no-stage-message">
                                <h3>Vous n'avez pas encore de stage attribué</h3>
                                <p>Veuillez attendre que l'administrateur vous assigne un stage avant de pouvoir générer une convention.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={`app-container ${isSidebarCollapsed ? 'collapsed' : 'expanded'}`}>
             
                <div className="main-container">
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
                </div>
            </div>
        );
    }

    if (!currentEtudiant) {
        return (
            <div className={`app-container ${isSidebarCollapsed ? 'collapsed' : 'expanded'}`}>
                <Header currentUser={currentUser} isSidebarCollapsed={isSidebarCollapsed} />
                <Sidebar
                    activeItem="rapport"
                    isSidebarCollapsed={isSidebarCollapsed}
                    setIsSidebarCollapsed={setIsSidebarCollapsed}
                />
                <div className="main-container">
                    <div className="main-content">
                        <div className="alert alert-danger">
                            Vous n'êtes pas autorisé à accéder à cette page ou aucune donnée d'étudiant n'a été trouvée.
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`app-container ${isSidebarCollapsed ? 'collapsed' : 'expanded'}`}>
            <Header currentUser={currentUser} isSidebarCollapsed={isSidebarCollapsed} />
            <Sidebar
                activeItem="rapport"
                isSidebarCollapsed={isSidebarCollapsed}
                setIsSidebarCollapsed={setIsSidebarCollapsed}
            />
            <div className="main-container">
                <div className="main-content">
                    <div className={`modal-overlay ${isSidebarCollapsed ? 'collapsed' : 'expanded'}`}>
                        <div 
                            className="modal-content" 
                            style={{
                                position: 'relative',
                                backgroundColor: '#fff',
                                margin: 'auto',
                                padding: '20px',
                                borderRadius: '3px',
                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                                width: '80%',
                                maxWidth: '400px',
                                maxHeight: '80vh',
                                overflowY: 'auto',
                                border: '1px solid #e0e0e0',
                                animation: 'fadeIn 0.3s ease-out'
                            }}
                        >
                            <h1>Rapport de Stage</h1>
                            <p className="student-info">
                                Étudiant: {currentEtudiant.utilisateur.nom} {currentEtudiant.utilisateur.prenom}
                                {stage && ` | Stage: ${stage.titre}`}
                            </p>

                            {existingRapport ? (
                                <div className="rapport-view">
                                    <p><strong>Titre:</strong> {existingRapport.titre}</p>
                                    <p><strong>Date de dépôt:</strong> {new Date(existingRapport.dateSoumission).toLocaleDateString()}</p>
                                    <a
                                        href={`http://localhost:5000/${existingRapport.urlDocument}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="download-button"
                                    >
                                        <i className="fas fa-eye"></i> Voir le rapport
                                    </a>
                                </div>
                            ) : (
                                <form className="add-student-form" onSubmit={handleDeposit}>
                                    <div className="form-group">
                                        <label htmlFor="titre">Titre du rapport</label>
                                        <input
                                            className="email-input"
                                            type="text"
                                            id="titre"
                                            value={titre}
                                            onChange={(e) => setTitre(e.target.value)}
                                            required
                                            placeholder="Entrez le titre de votre rapport"
                                        />
                                    </div>

                                    <input
                                        type="file"
                                        id="rapport-upload"
                                        accept="application/pdf"
                                        onChange={(e) => setSelectedFile(e.target.files[0])}
                                        className="file-input"
                                        required
                                    />
                                    <label htmlFor="rapport-upload">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                                            <path d="M14 3v5h5M12 18v-6M9 15h6"/>
                                        </svg>
                                        <span>Choisir un fichier PDF</span>
                                        {selectedFile && (
                                            <div className="file-name">
                                                Fichier sélectionné: {selectedFile.name}
                                            </div>
                                        )}
                                    </label>

                                    <div className="submit-button-container">
                                        <button
                                            type="button"
                                            className="cancel-button"
                                            onClick={() => navigate('/mes-rapports')}
                                        >
                                            <i className="fas fa-times"></i> Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            className="submit-button"
                                            disabled={depositLoading}
                                        >
                                            {depositLoading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                    Dépôt en cours...
                                                </>
                                            ) : 'Déposer le Rapport'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DepotRapport;
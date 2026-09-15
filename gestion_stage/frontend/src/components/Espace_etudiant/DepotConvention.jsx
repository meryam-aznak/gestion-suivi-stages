// src/pages/DepotConventionPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import Header from "../Header/Header.js";
import Sidebar from "./Sidebar/Sidebar.js";

const DepotConventionPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { etudiant, stage } = location.state || {};

    const [selectedFile, setSelectedFile] = useState(null);
    const [depositLoading, setDepositLoading] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [currentUser] = useState(JSON.parse(localStorage.getItem('user')) || {});

    useEffect(() => {
        if (!etudiant || !stage) {
            Swal.fire({
                title: 'Erreur',
                text: 'Données manquantes. Redirection...',
                icon: 'error'
            }).then(() => {
                navigate('/ConventionEtudiant');
            });
        }
    }, [etudiant, stage, navigate]);

    const handleDeposit = async (e) => {
        e.preventDefault(); // Prevent default form submission
        
        if (!selectedFile) {
            Swal.fire({
                title: 'Fichier requis',
                text: 'Veuillez sélectionner un fichier PDF avant de déposer.',
                icon: 'warning'
            });
            return;
        }

        setDepositLoading(true);
        const formData = new FormData();
        formData.append('pdf', selectedFile);
        formData.append('etudiant', etudiant._id);
        formData.append('encadrantUniv', stage.encadrantUniv?._id || '');
        formData.append('encadrantPro', stage.encadrantPro?._id || '');

        try {
            await axios.post(
                'http://localhost:5000/api/conventions/deposer',
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
                text: 'Convention déposée avec succès.',
                icon: 'success'
            }).then(() => {
                navigate('/ConventionEtudiant');
            });

        } catch (error) {
            console.error(error);
            Swal.fire({
                title: 'Erreur',
                text: error.response?.data?.message || 'Erreur lors du dépôt',
                icon: 'error'
            });
        } finally {
            setDepositLoading(false);
        }
    };

    return (
        <div className={`app-container ${isSidebarCollapsed ? 'collapsed' : 'expanded'}`}>
            <Header currentUser={currentUser} isSidebarCollapsed={isSidebarCollapsed} />
            <Sidebar
                activeItem="convention"
                isSidebarCollapsed={isSidebarCollapsed}
                setIsSidebarCollapsed={setIsSidebarCollapsed}
            />
            <div className="main-container">
                <div className="main-content">
                    <div className={`modal-overlay ${isSidebarCollapsed ? 'collapsed' : 'expanded'}`}>
                        <div className="modal-content">
                            <h1>Déposer la Convention Signée</h1>
                            <form className="add-student-form" onSubmit={handleDeposit}>
                               <input
    type="file"
    id="convention-upload"
    accept="application/pdf"
    onChange={(e) => setSelectedFile(e.target.files[0])}
    className="file-input"
    required
  />
  <label htmlFor="convention-upload">
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
                <button type="button" className="cancel-button" onClick={() => navigate('/ConventionEtudiant',)}>
                 <i className="fas fa-times"></i> Annuler
            </button>
                                <button
                                    type="submit"
                                    className="submit-button"
                                    disabled={depositLoading}
                                >
                                    {depositLoading ? 'Dépôt en cours...' : 'Déposer la Convention'}
                                </button>
                                                        </div>

                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DepotConventionPage;

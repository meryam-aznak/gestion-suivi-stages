import '../style.css';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from "../Header/Header.js";
import Sidebar from "./Sidebar/Sidebar.js";
import Swal from 'sweetalert2';
import SignatureCanvas from 'react-signature-canvas';
import emailjs from '@emailjs/browser';

const ConventionEtudiant = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [hasEncadrantPro, setHasEncadrantPro] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [etudiant, setEtudiant] = useState(null);
    const [etudiantData, setEtudiantData] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [mentorList, setMentorList] = useState([]);
    const [conventionGenerated, setConventionGenerated] = useState(false);
    const [studentStage, setStudentStage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [generateLoading, setGenerateLoading] = useState(false);
    const [depositLoading, setDepositLoading] = useState(false);
    const [formData, setFormData] = useState({
        mentorId: '',
        signatureData: ''
    });
    const [professionalEmail, setProfessionalEmail] = useState('');
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [conventionStatus, setConventionStatus] = useState(null);
    const [signatureUrl, setSignatureUrl] = useState(null);
    const [showSignatureCanvas, setShowSignatureCanvas] = useState(false);
    
    const signaturePad = useRef();
    const navigate = useNavigate();
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
    emailjs.init('l6w0hkLUMLzB_QeY8');
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
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
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData) {
            navigate('/login');
            return;
        }
        
        setCurrentUser(userData);
        fetchData(userData);
    }, [navigate]);


    const fetchData = async (userData) => {
        try {
            setLoading(true);
            
            const etudiantRes = await axios.get(
                `http://localhost:5000/api/etudiants/utilisateur/${userData._id}`,
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            const etudiantData = etudiantRes.data;
            setEtudiant(etudiantData);
            
            if (etudiantRes.data.utilisateur.signatureUrl) {
                setSignatureUrl(etudiantRes.data.utilisateur.signatureUrl);
            }
                        
            const stageRes = await axios.get(
                `http://localhost:5000/api/stage/etudiant/${etudiantData._id}`,
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );

            setStudentStage(stageRes.data.data);
            
            const hasEncadrant = stageRes.data.data.encadrantPro !== null && 
                               stageRes.data.data.encadrantPro !== undefined && 
                               Object.keys(stageRes.data.data.encadrantPro).length > 0;
            
            setHasEncadrantPro(hasEncadrant);
            
            const conventionRes = await axios.get(
                `http://localhost:5000/api/conventions/etudiant/${etudiantData._id}`,
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            
            if (conventionRes.data) {
                setConventionStatus({
                    etatConvention: conventionRes.data.etatConvention,
                    fichier: conventionRes.data.fichier
                });
            }
            
        } catch (err) {
            console.error("Fetch error:", err);
            if (err.response?.status !== 404) {
                Swal.fire({
                    title: 'Erreur',
                    text: 'Une erreur est survenue lors du chargement des données',
                    icon: 'error'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleSignatureView = () => {
        setShowSignatureCanvas(!showSignatureCanvas);
        if (signaturePad.current) {
            signaturePad.current.clear();
        }
    };

  const handleGenerateConvention = async (e, withSignature = false) => {
    e.preventDefault();
    
    setGenerateLoading(true);
    try {
        if (!studentStage?.encadrantPro) {
            throw new Error('Aucun encadrant professionnel assigné');
        }
        
        // Check if signature is required and not provided
        if (withSignature && !signatureUrl && (!signaturePad.current || signaturePad.current.isEmpty())) {
            throw new Error('Signature requise');
        }
        
        const payload = {
            stage: studentStage,
            etudiant: etudiant,
            encadrant: studentStage.encadrantPro,
            encadrantUniv: studentStage.encadrantUniv,
            ...(withSignature && { 
                // Use signature pad data if available, otherwise fall back to signatureUrl
                signatureData: (signaturePad.current && !signaturePad.current.isEmpty()) 
                    ? signaturePad.current.toDataURL() 
                    : signatureUrl || ''
            })
        };
        
        const response = await axios.post(
            'http://localhost:5000/api/conventions/generer', 
            payload, 
            { 
                responseType: 'blob',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }
        );
            
        if (response.status === 200) {
            const blob = response.data;
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `convention-${currentUser.nom}-${new Date().toISOString().slice(0,10)}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            
            await Swal.fire({
                title: 'Succès',
                text: 'Convention générée avec succès. Vous pouvez maintenant la télécharger.',
                icon: 'success',
                confirmButtonText: 'OK'
            });
            setConventionGenerated(true);
        } else {
            throw new Error('Erreur lors de la génération');
        }
    } catch (err) {
        console.error('Erreur:', err);
        Swal.fire({
            title: err.message === 'Signature requise' ? 'Signature requise' : 'Erreur',
            text: err.message === 'Signature requise' 
                ? 'Veuillez fournir votre signature électronique' 
                : err.response?.data?.message || err.message || 'Échec de la génération',
            icon: err.message === 'Signature requise' ? 'warning' : 'error',
            confirmButtonText: 'OK'
        });
    } finally {
        setGenerateLoading(false);
    }
};

    const handleDownloadConvention = () => {
        if (!conventionStatus?.fichier) {
            Swal.fire({
                title: 'Erreur',
                text: 'Aucun fichier de convention disponible',
                icon: 'error'
            });
            return;
        }

        const fileUrl = `http://localhost:5000${conventionStatus.fichier}`;
        console.log('Downloading from:', fileUrl);

        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = `convention-${currentUser.nom}-${currentUser.prenom}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

const handleInviteProfessionalByEmail = async () => {
    if (!professionalEmail) {
        Swal.fire({
            title: 'Email requis',
            text: 'Veuillez entrer un email valide',
            icon: 'warning',
            confirmButtonText: 'OK'
        });
        return;
    }
    setIsSendingEmail(true);

    try {
        // Generate a more consistent token
        const invitationToken = `invite_${Date.now()}_${crypto.randomUUID()}`;
        
        // Store in both localStorage and sessionStorage for redundancy
        localStorage.setItem(invitationToken, etudiant._id);
        sessionStorage.setItem(invitationToken, etudiant._id);
        
        // Create URL-safe token
        const encodedToken = encodeURIComponent(invitationToken);
        const registrationLink = `${window.location.origin}/CreerCompte?token=${encodedToken}`;

        console.log("Token stored:", invitationToken);
        console.log("Registration link:", registrationLink);

        await emailjs.send('service_y3ycx5h', 'template_dlrn3mn', {
            email: professionalEmail,
            studentName: `${currentUser.prenom} ${currentUser.nom}`,
            studentEmail: currentUser.email,
            registrationLink
        });

        await Swal.fire({
            title: 'Succès!',
            text: `Invitation envoyée à ${professionalEmail}`,
            icon: 'success'
        });

        setProfessionalEmail('');
        fetchData(currentUser);
    } catch (error) {
        console.error("Full error details:", error);
        Swal.fire({
            title: 'Erreur',
            text: error.response?.data?.message || error.message || "Erreur lors de l'envoi",
            icon: 'error'
        });
    } finally {
        setIsSendingEmail(false);
    }
};
    const clearSignature = () => {
        signaturePad.current.clear();
    };

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
                    {!studentStage ? (
                        <div className="no-stage-container">
                            <div className="no-stage-message">
                                <h3>Vous n'avez pas encore de stage attribué</h3>
                                <p>Veuillez attendre que l'administrateur vous assigne un stage avant de pouvoir générer une convention.</p>
                            </div>
                        </div>
                    ) : conventionStatus ? (
                       <div className="convention-status-container">
    <h3>Statut de votre convention de stage</h3>
    <div className="status-card">
        <p>
            <strong>Statut:</strong> 
            <span className={`status-badge ${
                conventionStatus.etatConvention === 'Valide' ? 'validated' : 
                conventionStatus.etatConvention === 'Non Valide' ? 'rejected' : 
                'pending'
            }`}>
                {conventionStatus.etatConvention === 'Valide' ? 'Validée' : 
                conventionStatus.etatConvention === 'Non Valide' ? 'Non Validée' : 
                'En attente de validation'}
            </span>
        </p>
        
        {conventionStatus.etatConvention === 'Non Valide' && (
            <p className="rejection-message">
                <i className="fas fa-exclamation-triangle"></i> Votre convention a été rejetée. 
                Veuillez la regénérer et la déposer à nouveau.
            </p>
        )}
        
        <div className="button-group">
            <button 
                onClick={handleDownloadConvention}
                className="download-button"
            >
                <i className="fas fa-eye"></i> Voir la convention
            </button>
            
            {conventionStatus.etatConvention === 'Non Valide' && (
                <button
                    onClick={() => {
                        setConventionStatus(null); // Reset convention status to show generation form
                    }}
                className="download-button"
                >
                    <i className="fas fa-redo"></i> Regénérer la convention
                </button>
            )}
        </div>
    </div>
</div>
                    ) : !hasEncadrantPro ? (
                        <div className="invite-professional-section" style={{ marginTop: 200 }}>
                            <h3>Inviter un encadrant professionnel</h3>
                            <p>Votre stage n'a pas encore d'encadrant professionnel. Veuillez inviter un encadrant :</p>
                            <div className="email-input-group">
                                <input
                                    type="email"
                                    value={professionalEmail}
                                    onChange={(e) => setProfessionalEmail(e.target.value)}
                                    placeholder="Email professionnel de votre encadrant"
                                    className="email-input"
                                />
                                <button 
                                    onClick={handleInviteProfessionalByEmail}
                                    className="submit-button"
                                    disabled={isSendingEmail}
                                >
                                    {isSendingEmail ? 'Envoi en cours...' : 'Envoyer invitation'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className={`modal-overlay ${isSidebarCollapsed ? 'collapsed' : 'expanded'} `}>
                                <div className="modal-content">
                                    <h1>Génération de la Convention de Stage</h1>
                                    <form className="add-student-form" onSubmit={handleGenerateConvention}>
                                        <div className="form-row">
                                            <div className="form-pair">
                                                <p><strong>Encadrant Professionnel :</strong> {studentStage.encadrantPro.utilisateur.nom} {studentStage.encadrantPro.utilisateur.prenom}</p>
                                                <p><strong>Encadrant Universitaire :</strong> {studentStage.encadrantUniv.utilisateur.nom} {studentStage.encadrantUniv.utilisateur.prenom}</p>
                                                <p><strong>Convention :</strong>
                                                <span disabled={generateLoading}
                                                    onClick={(e) => handleGenerateConvention(e, false)}style={{ cursor: 'pointer', color: '#1976d2',marginLeft: '10px' }}>
                                                    <i className="fas fa-expand"></i> Aperçu
                                                </span></p>
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-pair">
                                                <label>Signature électronique:</label>
                                                <div className="signature-container">
                                                    {signatureUrl && !showSignatureCanvas ? (
                                                        <div className="saved-signature">
                                                            <img 
                                                                src={`http://localhost:5000${signatureUrl}`} 
                                                                alt="Votre signature"
                                                                style={{ 
                                                                    width: '500px', 
                                                                    height: '150px',
                                                                    border: '1px solid #ccc',
                                                                    backgroundColor: '#fff'
                                                                }}
                                                            />
                                                            
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <SignatureCanvas 
                                                                ref={signaturePad} 
                                                                backgroundColor="#fff" 
                                                                penColor="black"
                                                                canvasProps={{ 
                                                                    width: 500, 
                                                                    height: 150, 
                                                                    className: 'signature-canvas'
                                                                }} 
                                                            />
                                                           
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="submit-button-container">
    {(!signatureUrl || showSignatureCanvas) && (
        <button 
            type="button" 
            onClick={clearSignature}
            className="cancel-button"
        >
            <i className="fas fa-times"></i> Effacer
        </button>
    )}
    <button 
        type="button" 
        onClick={toggleSignatureView}
        className="cancel-button"
    >
        <i className="fas fa-edit"></i> 
        {showSignatureCanvas ? "Utiliser la signature existante" : "Modifier la signature"}
    </button>
    <button 
        type="submit" 
        className="submit-button"
        disabled={generateLoading}
        onClick={(e) => handleGenerateConvention(e, true)}
    >
        {generateLoading ? (
            <span>Génération en cours...</span>
        ) : (signatureUrl && !showSignatureCanvas) ? (
            <>
                <i className="fas fa-file-download"></i> Générer avec signature existante
            </>
        ) : (
            <>
                <i className="fas fa-file-download"></i> Signer et générer
            </>
        )}
    </button>
    {/* "Aller au dépôt" button (now type="button" to avoid form submission) */}
    <button
        type="button"  // Prevents form submission
        onClick={() => navigate('/DepotConvention', { state: { etudiant, stage: studentStage } })}
        className="submit-button"
    >
        <i className="fas fa-upload"></i> Aller au dépôt
    </button>
</div>
                                    </form>
                                   
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConventionEtudiant;
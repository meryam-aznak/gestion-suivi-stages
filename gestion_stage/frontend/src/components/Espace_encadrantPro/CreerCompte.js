import '../style.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import emailjs from '@emailjs/browser';
import { useSearchParams, useNavigate } from 'react-router-dom';

const CreerCompte = ({ onClose, onAddEncadrant }) => {
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        adresse: '',
        nomOrganisme: '',
        raisonSociale: '',
        teleOrganisme: '',
        fonction: '',
        dateDebutStage: '',
        dateFinStage: '',
        horaireStage: '',
        sujetStage: ''
    });

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
     const [studentId, setStudentId] = useState(null); // Remplace studentId direct
    const token = searchParams.get('token'); 
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    

useEffect(() => {
    emailjs.init('l6w0hkLUMLzB_QeY8');
    
    if (token) {
        // Try multiple ways to retrieve the token
        const tryGetStudentId = (tokenToTry) => {
            return localStorage.getItem(tokenToTry) || 
                   sessionStorage.getItem(tokenToTry);
        };

        // Try different token variations
        const tokenVariations = [
            token, // original
            decodeURIComponent(token), // decoded once
            decodeURIComponent(decodeURIComponent(token)), // double decoded
            token.replace(/ /g, '+') // handle space/plus conversion
        ];

        let storedStudentId = null;
        
        for (const tokenVar of tokenVariations) {
            storedStudentId = tryGetStudentId(tokenVar);
            if (storedStudentId) {
                console.log("Found with token variation:", tokenVar);
                // Clean up all variations
                tokenVariations.forEach(t => {
                    localStorage.removeItem(t);
                    sessionStorage.removeItem(t);
                });
                break;
            }
        }

        if (storedStudentId) {
            setStudentId(storedStudentId);
            sessionStorage.setItem('currentStudentId', storedStudentId);
        } else {
            // Fallback to session storage
            const sessionStudentId = sessionStorage.getItem('currentStudentId');
            if (sessionStudentId) {
                setStudentId(sessionStudentId);
            } else {
                console.error("No student ID found for token");
                Swal.fire({
                    title: 'Lien invalide',
                    text: 'Ce lien d\'invitation a expiré ou est invalide.',
                    icon: 'error'
                }).then(() => {
                    navigate('/login');
                });
            }
        }
    }
}, [token, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const sendEmail = (email, password, nom, prenom) => {
        const templateParams = { email, password, nom, prenom };
    return emailjs.send('service_y3ycx5h', 'template_zgxkcop', templateParams);
    };

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            navigate('/login'); // Redirection vers login plutôt que navigate(-1)
        }
    };

    const assignEncadrantToStage = async (studentId, encadrantProId) => {
        try {
            const response = await axios.put(
                `http://localhost:5000/api/stage/affecterEncadrantPro/${studentId}`,
                { 
                    encadrantProId,
                    dateDebut: formData.dateDebutStage,
                    dateFin: formData.dateFinStage,
                    horaire: formData.horaireStage,
                    sujet: formData.sujetStage
                },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.success) {
                Swal.fire({
                    title: 'Succès',
                    text: 'L\'encadrant professionnel a été affecté au stage avec succès.',
                    icon: 'success'
                });
            } else {
                throw new Error('Échec de l\'affectation de l\'encadrant professionnel');
            }
        } catch (err) {
            Swal.fire({
                title: 'Erreur',
                text: err.message || 'Échec de l\'affectation',
                icon: 'error'
            });
            throw err; // On propage l'erreur pour la gérer dans handleSubmit
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const randomPassword = Math.random().toString(36).slice(-8);

        try {
            const encadrantResponse = await axios.post(
                'http://localhost:5000/api/encadrantProfessionnel',
                { ...formData, password: randomPassword },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (encadrantResponse.data.success) {
                const newEncadrant = encadrantResponse.data.encadrant;

                if (onAddEncadrant) {
                    onAddEncadrant(newEncadrant);
                }

                if (studentId) {
                    await assignEncadrantToStage(studentId, newEncadrant._id);
                }

                await sendEmail(
                    formData.email,
                    randomPassword,
                    formData.nom,
                    formData.prenom
                );

                await Swal.fire({
                    title: 'Succès!',
                    html: `
                        <p>Encadrant professionnel créé avec succès!</p>
                        ${studentId ? '<p>Il a été automatiquement assigné au stage de l\'étudiant.</p>' : ''}
                        <p><i class="fas fa-envelope"></i> Email: <strong>${formData.email}</strong></p>
                        <p><i class="fas fa-lock"></i> Mot de passe: <strong>${randomPassword}</strong></p>
                    `,
                    icon: 'success',
                    confirmButtonText: 'OK'
                }).then(() => {
                    // Redirection vers la page de login après confirmation
                    navigate('/login');
                });

            } else {
                throw new Error(encadrantResponse.data.message || 'Erreur lors de la création');
            }
        } catch (err) {
            console.error('Error:', err);
            Swal.fire({
                title: 'Erreur!',
                text: err.response?.data?.message || err.message || 'Une erreur est survenue',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

   const nextStep = () => {
        // Validate current step fields before proceeding
        let isValid = true;
        
        if (currentStep === 1) {
            if (!formData.nom || !formData.prenom || !formData.email || !formData.telephone) {
                isValid = false;
            }
        } else if (currentStep === 2) {
            if (!formData.fonction || !formData.nomOrganisme || !formData.teleOrganisme || !formData.raisonSociale || !formData.adresse) {
                isValid = false;
            }
        }

        if (!isValid) {
            Swal.fire({
                title: 'Champs manquants',
                text: 'Veuillez remplir tous les champs obligatoires',
                icon: 'warning'
            });
            return;
        }
        setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        setCurrentStep(currentStep - 1);
    };

    return (
        <div className="login-container">
        <div className="modal-overlay expanded">
            <div className="modal-content">
                <div className="modal-header">
                    <h1>Créer votre compte</h1>
                    
                </div>

                <form className="add-student-form" onSubmit={handleSubmit}>
                    {/* Step indicator */}
                    <div className="step-indicator" style={{ marginBottom: '20px' }}>
                        <span className={currentStep === 1 ? 'active' : ''}>1. Informations personnelles</span>
                        <span className={currentStep === 2 ? 'active' : ''}>2. Informations professionnelles</span>
                        <span className={currentStep === 3 ? 'active' : ''}>3. Informations du stage</span>
                    </div>

                    {currentStep === 1 && (
                        <>
                            <div className="form-row">
                                <div className="form-pair">
                                    <label>Nom:</label>
                                    <input type="text" name="nom" value={formData.nom} onChange={handleChange} required />
                                </div>
                                <div className="form-pair">
                                    <label>Prénom:</label>
                                    <input type="text" name="prenom" value={formData.prenom} onChange={handleChange} required />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-pair">
                                    <label>Email:</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                                </div>
                                <div className="form-pair">
                                    <label>Téléphone:</label>
                                    <input type="text" name="telephone" value={formData.telephone} onChange={handleChange} required />
                                </div>
                            </div>

                            <div className="submit-button-container">
                                <button type="button" className="cancel-button" onClick={handleClose} disabled={isSubmitting}>
                                    <i className="fas fa-times"></i> Annuler
                                </button>
                                <button type="button" className="submit-button" onClick={nextStep} disabled={isSubmitting}>
                                    Suivant <i className="fas fa-arrow-right"></i>
                                </button>
                            </div>
                        </>
                    )}

                    {currentStep === 2 && (
                        <>
                            <div className="form-row">
                                <div className="form-pair">
                                    <label>Fonction:</label>
                                    <input type="text" name="fonction" value={formData.fonction} onChange={handleChange} required />
                                </div>
                                <div className="form-pair">
                                    <label>Nom de l'organisme:</label>
                                    <input type="text" name="nomOrganisme" value={formData.nomOrganisme} onChange={handleChange} required />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-pair">
                                    <label>Téléphone de l'organisme:</label>
                                    <input type="text" name="teleOrganisme" value={formData.teleOrganisme} onChange={handleChange} required />
                                </div>
                                <div className="form-pair">
                                    <label>Raison sociale:</label>
                                    <input type="text" name="raisonSociale" value={formData.raisonSociale} onChange={handleChange} required />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-pair">
                                    <label>Adresse de l'organisme:</label>
                                    <input type="text" name="adresse" value={formData.adresse} onChange={handleChange} required />
                                </div>
                            </div>

                            <div className="submit-button-container">
                                <button type="button" className="cancel-button" onClick={prevStep} disabled={isSubmitting}>
                                    <i className="fas fa-arrow-left"></i> Précédent
                                </button>
                                <button type="button" className="submit-button" onClick={nextStep} disabled={isSubmitting}>
                                    Suivant <i className="fas fa-arrow-right"></i>
                                </button>
                            </div>
                        </>
                    )}

                    {currentStep === 3 && (
                        <>
                            <div className="form-row">
                                <div className="form-pair">
                                    <label>Date de début du stage:</label>
                                    <input 
                                        type="date" 
                                        name="dateDebutStage" 
                                        value={formData.dateDebutStage} 
                                        onChange={handleChange} 
                                        required 
                                    />
                                </div>
                                <div className="form-pair">
                                    <label>Date de fin du stage:</label>
                                    <input 
                                        type="date" 
                                        name="dateFinStage" 
                                        value={formData.dateFinStage} 
                                        onChange={handleChange} 
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-pair">
                                    <label>Horaire du stage:</label>
                                    <input 
                                        type="text" 
                                        name="horaireStage" 
                                        value={formData.horaireStage} 
                                        onChange={handleChange} 
                                        placeholder="Ex: 9h-17h du lundi au vendredi" 
                                        required 
                                    />
                                </div>
                                <div className="form-pair">
                                    <label>Sujet du stage:</label>
                                    <input 
                                        type="text" 
                                        name="sujetStage" 
                                        value={formData.sujetStage} 
                                        onChange={handleChange} 
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="submit-button-container">
                                <button type="button" className="cancel-button" onClick={prevStep} disabled={isSubmitting}>
                                    <i className="fas fa-arrow-left"></i> Précédent
                                </button>
                                <button type="submit" className="submit-button" disabled={isSubmitting}>
                                    {isSubmitting ? <span>En cours...</span> : <><i className="fas fa-user-plus"></i> S'inscrire</>}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
        </div>
    );
};

export default CreerCompte;
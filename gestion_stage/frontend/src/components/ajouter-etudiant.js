import './style.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import emailjs from '@emailjs/browser';

const AjouterEtudiant = ({ onClose, onAddStudent, filieres }) => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    adresse: '',
    codeApogee: '',
    telephone: '',
    dateNaissance: '',
    numSecurite: '',
    filiere: '',
    promotion: '',
    statut: '',
    semestre: ''
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [semestres, setSemestres] = useState([]);
  const [loadingSemestres, setLoadingSemestres] = useState(true);
  const [errorSemestres, setErrorSemestres] = useState(null);

  useEffect(() => {
    emailjs.init('l6w0hkLUMLzB_QeY8');
    
  const fetchSemestres = async () => {
  try {
    setLoadingSemestres(true);
    const response = await axios.get('http://localhost:5000/api/etudiants/semestre');
    
    // Handle the modified response structure
    if (response.data?.success) {
      const semestresData = response.data.data; // Now directly accessing the array
      
      if (semestresData && semestresData.length > 0) {
        setSemestres(semestresData);
      } else {
        setErrorSemestres('No semestres available for Master level');
      }
    } else {
      setErrorSemestres(response.data?.message || 'Invalid response structure');
    }
  } catch (err) {
    console.error('Fetch error:', err);
    setErrorSemestres(
      err.response?.data?.message || 
      err.message || 
      'Failed to load semestres'
    );
  } finally {
    setLoadingSemestres(false);
  }
};
   


    fetchSemestres();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const sendEmail = (email, password, nom, prenom) => {
    const templateParams = { email, password, nom, prenom };
    return emailjs.send('service_y3ycx5h', 'template_zgxkcop', templateParams);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const randomPassword = Math.random().toString(36).slice(-8);
  
    try {
      const response = await axios.post('http://localhost:5000/api/etudiants', {
        ...formData, 
        password: randomPassword
      });
  
      if (response.data.success) {
        onAddStudent(response.data.etudiant);
        await sendEmail(formData.email, randomPassword, formData.nom, formData.prenom);
        
        Swal.fire({
          title: 'Étudiant ajouté avec succès!',
          html: `
            <p><i class="fas fa-envelope"></i> Email: <strong>${formData.email}</strong></p>
            <p><i class="fas fa-lock"></i> Mot de passe: <strong>${randomPassword}</strong></p>
          `,
          icon: 'success',
          confirmButtonText: 'OK'
        }).then(() => {
          onClose();
        });
      } else {
        throw new Error(response.data.message || 'Erreur lors de l\'ajout');
      }
    } catch (err) {
      console.error('Erreur:', err);
      Swal.fire({
        title: 'Erreur!',
        text: err.response?.data?.message || err.message || 'Erreur lors de l\'ajout',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3E77B4'
      });
    }
  };

  return (
    <div className={`modal-overlay ${isSidebarCollapsed ? 'collapsed' : 'expanded'} ${showAddModal ? 'blurred' : ''}`}>
      <div className="modal-content">
        <h1>Ajouter Un Nouveau Étudiant</h1>
        <form className="add-student-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-pair">
              <label>Nom: <span className="required-star">*</span></label>
              <input type="text" name="nom" value={formData.nom} onChange={handleChange} required />
            </div>
            <div className="form-pair">
              <label>Prénom: <span className="required-star">*</span></label>
              <input type="text" name="prenom" value={formData.prenom} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-pair">
              <label>Email: <span className="required-star">*</span></label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="form-pair">
              <label>Téléphone: </label>
              <input type="text" name="telephone" value={formData.telephone} onChange={handleChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-pair">
              <label>Date De Naissance: </label>
              <input type="date" name="dateNaissance" value={formData.dateNaissance} onChange={handleChange} />
            </div>
            <div className="form-pair">
              <label>Adresse: </label>
              <input type="text" name="adresse" value={formData.adresse} onChange={handleChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-pair">
              <label>Code Apogée: <span className="required-star">*</span></label>
              <input type="text" name="codeApogee" value={formData.codeApogee} onChange={handleChange} required />
            </div>
            <div className="form-pair">
              <label>Filière: <span className="required-star">*</span></label>
              <select 
                name="filiere" 
                value={formData.filiere} 
                onChange={handleChange} 
                required
              >
                <option value="">Sélectionner une filière</option>
                {filieres.map(filiere => (
                  <option key={filiere._id} value={filiere._id}>
                    {filiere.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-pair">
              <label>Numéro de Sécurité:</label>
              <input type="text" name="numSecurite" value={formData.numSecurite} onChange={handleChange} />
            </div>
            <div className="form-pair">
              <label>Promotion:<span className="required-star">*</span></label>
              <select 
                name="promotion" 
                value={formData.promotion} 
                onChange={handleChange}
                required
              >
                <option value="">Sélectionner une année</option>
                {Array.from(
                  { length: new Date().getFullYear() + 2 - 1912 },
                  (_, i) => 1912 + i
                ).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                )).reverse()}
              </select>          
            </div>
          </div>

          <div className="form-row">
            <div className="form-pair">
              <label>Statut:</label>
              <select name="statut" value={formData.statut} onChange={handleChange}>
                <option value="">Choisir un statut</option>
                <option value="EN_STAGE">En stage</option>
                <option value="EN_COURS">En cours</option>
                <option value="LAUREAT">Lauréat</option>
                <option value="EN_ATTENTE">En attente</option>
              </select>
            </div>
            <div className="form-pair">
              <label>Semestre:<span className="required-star">*</span></label>
              {loadingSemestres ? (
                <p>Chargement des semestres...</p>
              ) : errorSemestres ? (
                <p className="error-message">{errorSemestres}</p>
              ) : semestres.length === 0 ? (
                <p>Aucun semestre disponible</p>
              ) : (
                <select name="semestre" value={formData.semestre} onChange={handleChange} >
                  <option value="">Choisir un semestre</option>
                  {semestres.map((semestre) => (
                    <option key={semestre._id} value={semestre._id}>
                      {semestre.nom}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="submit-button-container">
            <button type="button" className="cancel-button" onClick={onClose}>
              <i className="fas fa-times"></i> Annuler
            </button>
            <button type="submit" className="submit-button">
              <i className="fas fa-user-plus"></i> Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AjouterEtudiant;
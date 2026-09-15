import './style.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const ModifierEtudiant = ({ etudiant, onClose, onUpdateStudent, filieres }) => {
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
  const [semestres, setSemestres] = useState([]);
  const [loadingSemestres, setLoadingSemestres] = useState(true);
  const [errorSemestres, setErrorSemestres] = useState(null);

  useEffect(() => {
    const fetchSemestres = async () => {
      try {
        setLoadingSemestres(true);
        const response = await axios.get('http://localhost:5000/api/etudiants/semestre');
        
        if (response.data?.success) {
          const semestresData = response.data.data;
          
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

  useEffect(() => {
    if (etudiant) {
      let formattedDate = '';
      if (etudiant.dateNaissance) {
        if (etudiant.dateNaissance.includes('T')) {
          formattedDate = etudiant.dateNaissance.split('T')[0];
        } 
        else if (etudiant.dateNaissance instanceof Date) {
          formattedDate = etudiant.dateNaissance.toISOString().split('T')[0];
        }
        else {
          const dateParts = etudiant.dateNaissance.split('/');
          if (dateParts.length === 3) {
            formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
          } else {
            formattedDate = etudiant.dateNaissance;
          }
        }
      }

      setFormData({
        nom: etudiant.utilisateur?.nom || '',
        prenom: etudiant.utilisateur?.prenom || '',
        email: etudiant.utilisateur?.email || '',
        adresse: etudiant.utilisateur?.adresse || '',
        codeApogee: etudiant.codeApogee || '',
        dateNaissance: formattedDate,
        numSecurite: etudiant.numSecurite || '',
        filiere: etudiant.filiere?._id || etudiant.filiere || '',
        promotion: etudiant.promotion || '',
        telephone: etudiant.utilisateur?.telephone || '', 
        statut: etudiant.statut || '',
        semestre: etudiant.semestre?._id || etudiant.semestre || ''
      });
    }
  }, [etudiant]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const updatedData = {
      _id: etudiant._id,
      codeApogee: formData.codeApogee,
      dateNaissance: formData.dateNaissance,
      numSecurite: formData.numSecurite,
      filiere: formData.filiere,
      promotion: formData.promotion,
      statut: formData.statut,
      semestre: formData.semestre,
      utilisateur: {
        _id: etudiant.utilisateur?._id,
        nom: formData.nom,
        prenom: formData.prenom,
        telephone: formData.telephone,
        email: formData.email,
        adresse: formData.adresse,
      },
    };
  
    try {
      const response = await axios.put(
        `http://localhost:5000/api/etudiants/${etudiant._id}`,
        updatedData
      );
  
      const success = await onUpdateStudent(response.data);
  
      if (success !== false) {
        Swal.fire({
          title: 'Étudiant modifié avec succès!',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#3E77B4',
        }).then(() => {
          onClose();
        });
      }
    } catch (err) {
      console.error('Erreur:', err);
      Swal.fire({
        title: 'Erreur!',
        text: err.response?.data?.message || 'Une erreur est survenue lors de la modification.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3E77B4',
      });
    }
  };

  return (
    <div className="modal-overlay expanded">
      <div className="modal-content">
        <h1>Modifier Étudiant</h1>
        <form className="add-student-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-pair">
              <label>Nom: <span className="required-star">*</span></label>
              <input type="text" name="nom" value={formData.nom} onChange={handleChange}  />
            </div>
            <div className="form-pair">
              <label>Prénom: <span className="required-star">*</span></label>
              <input type="text" name="prenom" value={formData.prenom} onChange={handleChange}  />
            </div>
          </div>

          <div className="form-row">
            <div className="form-pair">
              <label>Email: <span className="required-star">*</span></label>
              <input type="email" name="email" value={formData.email} onChange={handleChange}  />
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
              <input type="text" name="codeApogee" value={formData.codeApogee} onChange={handleChange}  />
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
              <label>Promotion: <span className="required-star">*</span></label>
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
              <label>Semestre: <span className="required-star">*</span> </label>
              {loadingSemestres ? (
                <p>Chargement des semestres...</p>
              ) : errorSemestres ? (
                <p className="error-message">{errorSemestres}</p>
              ) : semestres.length === 0 ? (
                <p>Aucun semestre disponible</p>
              ) : (
                <select name="semestre" value={formData.semestre} onChange={handleChange} required>
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
              <i className="fas fa-save"></i> Modifier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModifierEtudiant;
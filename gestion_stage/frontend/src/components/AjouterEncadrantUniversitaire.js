import './style.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import emailjs from '@emailjs/browser';

const AjouterEncadrant = ({ onClose, onAddEncadrant }) => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    specialite: '',
    filiere: '',
    numSomme: '',
    etablissement: '',
    universite: '',
  });

  const [filieres, setFilieres] = useState([]);
  const [loadingFilieres, setLoadingFilieres] = useState(true);

  useEffect(() => {
    emailjs.init('l6w0hkLUMLzB_QeY8');
    fetchFilieres();
  }, []);

  const fetchFilieres = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/filieres');
      setFilieres(response.data);
      setLoadingFilieres(false);
    } catch (error) {
      console.error('Error fetching filières:', error);
      setLoadingFilieres(false);
      Swal.fire({
        title: 'Erreur',
        text: 'Impossible de charger la liste des filières',
        icon: 'error'
      });
    }
  };

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
      const response = await axios.post('http://localhost:5000/api/encadrantUniversitaire', {
        ...formData, 
        password: randomPassword
      });
  
      if (response.data.success) {
        onAddEncadrant(response.data.encadrant);
        
        await sendEmail(formData.email, randomPassword, formData.nom, formData.prenom);
        
        Swal.fire({
          title: 'Encadrant ajouté avec succès!',
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
        confirmButtonColor: '#3E77B4'      });
    }
  };

  return (
    <div className="modal-overlay expanded">
      <div className="modal-content">
        <h1>Ajouter Un Encadrant Universitaire</h1>
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
              <label>Téléphone:</label>
              <input type="text" name="telephone" value={formData.telephone} onChange={handleChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-pair">
              <label>Spécialité:</label>
              <input type="text" name="specialite" value={formData.specialite} onChange={handleChange} />
            </div>
            <div className="form-pair">
              <label>Filière:</label>
              {loadingFilieres ? (
                <select disabled>
                  <option>Chargement des filières...</option>
                </select>
              ) : (
                <select 
                  name="filiere" 
                  value={formData.filiere} 
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">Sélectionner une filière</option>
                  {filieres.map(filiere => (
                    <option key={filiere._id} value={filiere._id}>
                      {filiere.nom}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-pair">
              <label>Etablissement:</label>
              <input type="text" name="etablissement" value={formData.etablissement} onChange={handleChange} />
            </div>
            <div className="form-pair">
              <label>Université:</label>
              <input type="text" name="universite" value={formData.universite} onChange={handleChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-pair">
              <label>Numero de Somme: <span className="required-star">*</span></label>
              <input type="text" name="numSomme" value={formData.numSomme} onChange={handleChange} required />
            </div>
            <div className="form-pair">
              <label>Adresse:</label>
              <input type="text" name="adresse" value={formData.adresse} onChange={handleChange} />
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

export default AjouterEncadrant;
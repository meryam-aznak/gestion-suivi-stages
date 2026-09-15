import './style.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const EtudiantAffecter = ({ etudiant, onClose, onUpdateStudent }) => {
  const [formData, setFormData] = useState({
    encadrantUnivId: ''
  });
  const [encadrants, setEncadrants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const fetchEncadrants = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/encadrantUniversitaire');
        setEncadrants(response.data);
      } catch (error) {
        console.error('Error fetching supervisors:', error);
        Swal.fire({
          title: 'Erreur',
          text: 'Impossible de charger la liste des encadrants',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    };
    fetchEncadrants();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try{
    const stageData = {
        etudiantId: etudiant._id,
        encadrantUnivId: formData.encadrantUnivId
      };
    
      const response = await axios.post('http://localhost:5000/api/stage', stageData);
        
        if (response.data.success) {
          // Call onAddStage with the new stage data
                onUpdateStudent(etudiant._id);

          // Close the modal
          onClose();
           Swal.fire({
                title: 'Succès!',
                text: 'L \'encadrant universitaire a été assigné avec succès.',
                icon: 'success',
                confirmButtonText: 'OK',
              });
        } else {
          throw new Error(response.data.message || 'Erreur lors de l\'ajout du stage');
        }
      } catch (err) {
        console.error('Erreur:', err);
        let errorMessage = err.message;
        
        if (err.response?.data?.errors) {
          errorMessage = Object.values(err.response.data.errors)
            .map(error => error.message)
            .join('\n');
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
    
        Swal.fire({
          title: 'Erreur!',
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      } finally {
        setLoading(false);
      }
    };

   

  return (
    <div className={`modal-overlay ${isSidebarCollapsed ? 'collapsed' : 'expanded'} ${showAddModal ? 'blurred' : ''}`}>
      <div className="modal-content">
        <h2>Affecter un encadrant</h2>
        <form className="add-student-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-pair">
              <label>Étudiant:</label>
              <input 
                type="text" 
                value={`${etudiant.utilisateur?.nom} ${etudiant.utilisateur?.prenom}`}
                readOnly 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-pair">
              <label>Encadrant Universitaire:</label>
              <select
                value={formData.encadrantUnivId}
                onChange={(e) => setFormData({...formData, encadrantUnivId: e.target.value})}
                required
                disabled={loading}
              >
                <option value="">Sélectionner un encadrant</option>
                {encadrants.map(encadrant => (
                  <option key={encadrant._id} value={encadrant._id}>
                    {encadrant.utilisateur?.nom} {encadrant.utilisateur?.prenom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="submit-button-container">
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="cancel-button" 
            >
              Annuler
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading || !formData.encadrantUnivId}
            >
              {loading ? 'Traitement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EtudiantAffecter;
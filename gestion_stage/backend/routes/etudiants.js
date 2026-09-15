const express = require('express');
const router = express.Router();
const { 
  getEtudiants, 
  addEtudiant, 
  updateEtudiant, 
  deleteEtudiant,
  getEtudiantByUserId,
  getEtudiantsEnAttente ,
  updateEtudiantStatus,
  getEtudiantById
} = require('../controllers/etudiantsController');
const { 
    getMasterSemestres
  } = require('../controllers/semestreController');
  

// Routes
router.get('/semestre', getMasterSemestres);
router.get('/', getEtudiants);
router.get('/en-attente', getEtudiantsEnAttente); // Route spécifique pour les étudiants en attente
router.post('/', addEtudiant);
router.put('/:id', updateEtudiant);
router.delete('/:id', deleteEtudiant);
router.get('/utilisateur/:userId', getEtudiantByUserId);
router.put('/:id/update-status', updateEtudiantStatus);
router.get('/etu/:id', getEtudiantById);


module.exports = router;

const express = require('express');
const router = express.Router();
const { 
    getEncadrantsUniversitaire, 
    addEncadrantUniversitaire, 
    updateEncadrantUniversitaire, 
    deleteEncadrantUniversitaire ,
    getEncadrantUnivByUserId,
    getEncadrantUniversitaireByUserId
  } = require('../controllers/EncadrantUniversitaireController'); 

// Routes
router.get('/', getEncadrantsUniversitaire);
router.post('/', addEncadrantUniversitaire);
router.put('/:id', updateEncadrantUniversitaire);
router.delete('/:id', deleteEncadrantUniversitaire);
router.get('/utilisateur/:userId', getEncadrantUnivByUserId);
router.get('/by-user/:userId', getEncadrantUniversitaireByUserId);


module.exports = router;
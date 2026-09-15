const express = require('express');
const router = express.Router();
const { 
    addFiliere, 
    getAllFilieres, 
    getFiliereById, 
    updateFiliere ,
    deleteFiliere
  } = require('../controllers/filliereController'); 

router.post('/', addFiliere);
router.get('/', getAllFilieres);
router.get('/:id', getFiliereById);
router.put('/:id', updateFiliere);
router.delete('/:id', deleteFiliere);

module.exports = router;
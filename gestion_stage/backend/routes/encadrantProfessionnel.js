const express = require('express');
const router = express.Router();
const { 
  getEncadrantsProfessionnel, 
  addEncadrantProfessionnel, 
  updateEncadrantProfessionnel, 
  deleteEncadrantProfessionnel,
  createEncadrantProAndAffectStage,
  getEncadrantProfessionnelByUserId
} = require('../controllers/EncadrantProfessionnelController');

// Routes
router.get('/', getEncadrantsProfessionnel);
router.get('/by-user/:userId', getEncadrantProfessionnelByUserId);

router.post('/', addEncadrantProfessionnel);
router.put('/:id', updateEncadrantProfessionnel);
router.delete('/:id', deleteEncadrantProfessionnel);
module.exports = router;
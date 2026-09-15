const express = require('express');
const router = express.Router();
const {
  createStage,
  getAllStages,
  getStageById,
  updateStage,
  deleteStage,
  getStageByStudentId,
  assignEncadrantProToStage,
  getStagesByEncadrantUnivId ,
  getStagesByEncadrantProId
} = require('../controllers/stageController');


// Routes pour les stages
router.post('/', createStage);
router.get('/', getAllStages);
router.get('/:id', getStageById);
router.get('/etudiant/:studentId', getStageByStudentId);  // New route
router.put('/:id', updateStage);
router.delete('/:id', deleteStage);
router.put('/affecterEncadrantPro/:studentId', assignEncadrantProToStage);
router.get('/encadrantUniv/:encadrantUnivId', getStagesByEncadrantUnivId);
router.get('/encadrantPro/:encadrantProId', getStagesByEncadrantProId);




module.exports = router;
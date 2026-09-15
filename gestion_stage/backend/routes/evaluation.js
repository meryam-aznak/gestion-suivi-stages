const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');

router.post('/', evaluationController.createEvaluation);
router.get('/', evaluationController.getAllEvaluations);
router.get('/:id', evaluationController.getEvaluationById);
router.put('/:id', evaluationController.updateEvaluation);
router.delete('/:id', evaluationController.deleteEvaluation);
router.get('/student/:etudiantId', evaluationController.getEvaluationsByStudent);
router.get('/evaluator/:evaluatorId/:evaluatorType', evaluationController.getEvaluationsByEvaluator);

module.exports = router;
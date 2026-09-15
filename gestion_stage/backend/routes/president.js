const express = require('express');
const router = express.Router();
const presidentController = require('../controllers/presidentController');

// Routes
router.get('/', presidentController.getPresidents);
router.get('/:id', presidentController.getPresidentById);  // This was likely missing
router.post('/', presidentController.addPresident);
router.put('/:id', presidentController.updatePresident);
router.delete('/:id', presidentController.deletePresident);

module.exports = router;
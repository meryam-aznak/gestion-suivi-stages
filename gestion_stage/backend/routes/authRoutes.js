const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');


// Login route
router.post('/login', authController.login);

// Example protected route
router.get('/protected', authController.verifyToken, (req, res) => {
  res.json({ 
    message: 'Protected content', 
    user: req.user 
  });
});
router.post('/update-password', authController.updatePassword);
router.post('/initiate-reset', authController.initiateReset);
router.post('/verify-reset-code', authController.verifyResetCode);
router.post('/reset-password', authController.resetPassword);
router.put('/modifier/:id', authController.updateUtilisateur);


module.exports = router;

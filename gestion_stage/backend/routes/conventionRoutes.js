// routes/conventionRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  generateConvention,
  deposerConvention,
  getConventionByEtudiant,
  getConventionsByEncadrantPro,
  signConventionEncadrantPro,
  getConventionsByEncadrantUniv,
  signConventionEncadrantUniv,
  validateConvention,
  getSignedConventions,
  signConventionAdmin,
  refuserConvention
} = require('../controllers/conventionController');

// Configuration de stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Routes
router.post('/generer', generateConvention);
router.post('/deposer', upload.single('pdf'), deposerConvention);
router.get('/etudiant/:id', getConventionByEtudiant);
router.get('/encadrant-pro/:id', getConventionsByEncadrantPro);
router.put('/signer/:id', signConventionEncadrantPro);
router.get('/encadrant-univ/:id', getConventionsByEncadrantUniv);
router.put('/signUniv/:id', signConventionEncadrantUniv);
router.put('/admin-signer/:id', signConventionAdmin);
router.patch('/:id/validate', validateConvention);
router.get('/signed', getSignedConventions);
router.put('/refuser/:id', refuserConvention);



module.exports = router;

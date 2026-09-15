// routes/rapportStage.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { deposerRapport,getRapportByEtudiant,getRapportsByEncadrantUniv ,getRapportsByEncadrantPro} = require('../controllers/RapportStageControler');

// Configuration de stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/rapports/';
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF sont acceptés'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Routes
router.post('/deposer', upload.single('pdf'), deposerRapport);
router.get('/etudiant/:id', getRapportByEtudiant);
router.get('/encadrant-univ/:id', getRapportsByEncadrantUniv);
router.get('/encadrant-pro/:id', getRapportsByEncadrantPro);



module.exports = router;
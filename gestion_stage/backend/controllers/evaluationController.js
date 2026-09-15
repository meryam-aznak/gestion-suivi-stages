const mongoose = require('mongoose');
const Evaluation = require('../models/evaluation');

// Create a new evaluation
exports.createEvaluation = async (req, res) => {
  try {
    const { note, commentaires, etudiant, evaluateur, evaluateurModel } = req.body;
    
    // Validate required fields
    if (!note || !etudiant) {
      return res.status(400).json({ message: 'Note and etudiant are required' });
    }
    
    // Validate evaluateurModel if evaluateur is provided
    if (evaluateur && !evaluateurModel) {
      return res.status(400).json({ message: 'evaluateurModel is required when evaluateur is provided' });
    }
    
    const newEvaluation = new Evaluation({
      note,
      commentaires,
      etudiant,
      evaluateur,
      evaluateurModel
    });
    
    const savedEvaluation = await newEvaluation.save();
    
    // Populate with nested user information
    const populatedEvaluation = await Evaluation.findById(savedEvaluation._id)
      .populate({
        path: 'etudiant',
        populate: {
          path: 'utilisateur',
          model: 'Utilisateur',
          select: 'nom prenom email role'
        }
      })
      .populate('evaluateur');
    
res.status(201).json({
  _id: savedEvaluation._id,
  success: true,
  message: 'Évaluation crée avec succès',
  data: populatedEvaluation
});  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all evaluations with student names
exports.getAllEvaluations = async (req, res) => {
  try {
    const evaluations = await Evaluation.find()
      .populate({
        path: 'etudiant',
        populate: {
          path: 'utilisateur',
          model: 'Utilisateur',
          select: 'nom prenom email role'
        }
      })
      .populate('evaluateur');
      
    res.status(200).json(evaluations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single evaluation by ID with student name
exports.getEvaluationById = async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id)
      .populate({
        path: 'etudiant',
        populate: {
          path: 'utilisateur',
          model: 'Utilisateur',
          select: 'nom prenom email role'
        }
      })
      .populate('evaluateur');
      
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }
    
    res.status(200).json(evaluation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update an evaluation
exports.updateEvaluation = async (req, res) => {
  try {
    const { id } = req.params;
    const { note, commentaires, etudiant, evaluateur, evaluateurModel } = req.body;
    
    // Validate evaluateurModel if evaluateur is provided
    if (evaluateur && !evaluateurModel) {
      return res.status(400).json({ message: 'evaluateurModel is required when evaluateur is provided' });
    }
    
    const updatedEvaluation = await Evaluation.findByIdAndUpdate(
      id,
      { note, commentaires, etudiant, evaluateur, evaluateurModel },
      { new: true, runValidators: true }
    )
    .populate({
      path: 'etudiant',
      populate: {
        path: 'utilisateur',
        model: 'Utilisateur',
        select: 'nom prenom email role'
      }
    })
    .populate('evaluateur');
    
    if (!updatedEvaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }
    
    res.status(200).json(updatedEvaluation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete an evaluation
exports.deleteEvaluation = async (req, res) => {
  try {
    const deletedEvaluation = await Evaluation.findByIdAndDelete(req.params.id);
    
    if (!deletedEvaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }
    
    res.status(200).json({ message: 'Évaluation supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get evaluations by student ID with student name
exports.getEvaluationsByStudent = async (req, res) => {
  try {
    const evaluations = await Evaluation.find({ etudiant: req.params.etudiantId })
      .populate({
        path: 'etudiant',
        populate: {
          path: 'utilisateur',
          model: 'Utilisateur',
          select: 'nom prenom email role'
        }
      })
      .populate('evaluateur');
      
    res.status(200).json(evaluations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get evaluations by evaluator ID and type with student names
exports.getEvaluationsByEvaluator = async (req, res) => {
  try {
    const { evaluatorId, evaluatorType } = req.params;
    
    const evaluations = await Evaluation.find({ 
      evaluateur: evaluatorId,
      evaluateurModel: evaluatorType 
    })
    .populate({
      path: 'etudiant',
      populate: {
        path: 'utilisateur',
        model: 'Utilisateur',
        select: 'nom prenom email role'
      }
    })
    .populate('evaluateur');
    
    res.status(200).json(evaluations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get evaluations with detailed student information
exports.getEvaluationsWithStudentDetails = async (req, res) => {
  try {
    const evaluations = await Evaluation.find()
      .populate({
        path: 'etudiant',
        select: 'codeApogee promotion statut',
        populate: [
          {
            path: 'utilisateur',
            model: 'Utilisateur',
            select: 'nom prenom email telephone'
          },
          {
            path: 'filiere',
            model: 'Filiere',
            select: 'nom'
          }
        ]
      })
      .populate('evaluateur');
      
    res.status(200).json(evaluations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get evaluations for current evaluator (based on role)
exports.getMyEvaluations = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let query = {};
    
    if (userRole === 'EncadrantUniv') {
      query = { 
        evaluateur: userId,
        evaluateurModel: 'EncadrantUniversitaire'
      };
    } else if (userRole === 'EncadrantPro') {
      query = { 
        evaluateur: userId,
        evaluateurModel: 'EncadrantProfessionnel'
      };
    } else {
      return res.status(403).json({ message: 'Unauthorized to view evaluations' });
    }

    const evaluations = await Evaluation.find(query)
      .populate({
        path: 'etudiant',
        populate: {
          path: 'utilisateur',
          model: 'Utilisateur',
          select: 'nom prenom email'
        }
      });
      
    res.status(200).json(evaluations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
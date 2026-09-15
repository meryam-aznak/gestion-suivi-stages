const Etudiant = require('../models/Etudiant');
const Utilisateur = require('../models/Utilisateur');
const Semestre = require('../models/Semestre');
const Filiere = require('../models/Filiere');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const Stage = require('../models/Stage');
const ConventionStage = require('../models/ConventionStage');
const RapportStage = require('../models/RapportStage');


// Get all students
exports.getEtudiants = async (req, res) => {
  try {
    const etudiants = await Etudiant.find()
      .populate('utilisateur')
      .populate('semestre')
      .populate('filiere'); // Added population for filiere
    res.json(etudiants);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};



exports.addEtudiant = async (req, res) => {
  try {
    const { 
      nom, 
      prenom, 
      email, 
      codeApogee, 
      filiere, 
      promotion, 
      telephone, 
      statut, 
      password,
      adresse,
      numSecurite,
      dateNaissance,
      semestre 
    } = req.body;

    // Validate required fields
    const requiredFields = ['nom', 'prenom', 'email', 'codeApogee', 'filiere', 'password'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Champs obligatoires manquants',
        missingFields 
      });
    }

    // Check if the filiere exists
    const filiereExists = await Filiere.findById(filiere);
    if (!filiereExists) {
      return res.status(400).json({ 
        success: false,
        message: 'La filière spécifiée n\'existe pas' 
      });
    }

    // Check if email or codeApogee already exists
    const emailExists = await Utilisateur.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ 
        success: false,
        message: 'Cet email est déjà utilisé' 
      });
    }

    const codeExists = await Etudiant.findOne({ codeApogee });
    if (codeExists) {
      return res.status(400).json({ 
        success: false,
        message: 'Ce code Apogée existe déjà' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const utilisateur = new Utilisateur({
      nom,
      prenom,
      email,
      mdp: hashedPassword,
      role: 'Etudiant',
      ...(telephone && { telephone }),
      ...(adresse && { adresse })
    });

    await utilisateur.save();

    // Create student
    const etudiant = new Etudiant({
      codeApogee,
      filiere,
      utilisateur: utilisateur._id,
      ...(promotion && { promotion }),
      ...(statut && { statut }),
      ...(dateNaissance && { dateNaissance }),
      ...(numSecurite && { numSecurite }),
      ...(semestre && { semestre })
    });

    await etudiant.save();

    // Get complete student data with populated user and filiere
    const completeEtudiant = await Etudiant.findById(etudiant._id)
      .populate('utilisateur')
      .populate('filiere')
      .populate('semestre');

    res.status(201).json({
      success: true,
      message: 'Étudiant ajouté avec succès',
      etudiant: completeEtudiant
    });

  } catch (err) {
    console.error('Error in addEtudiant:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de l\'ajout',
      error: err.message 
    });
  }
};
exports.updateEtudiant = async (req, res) => {
  try {
    const { id } = req.params;
    const { codeApogee, filiere, numSecurite, dateNaissance, promotion, statut, semestre, utilisateur } = req.body;

    // Verify filiere exists if it's being updated
    if (filiere) {
      const filiereExists = await Filiere.findById(filiere);
      if (!filiereExists) {
        return res.status(400).json({ message: 'La filière spécifiée n\'existe pas' });
      }
    }

    // Update user
    const updatedUser = await Utilisateur.findByIdAndUpdate(
      utilisateur._id,
      {
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        telephone: utilisateur.telephone,
        adresse: utilisateur.adresse,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    // Prepare student update data
    const updateData = {
      codeApogee,
      promotion,
      statut,
      dateNaissance,
      numSecurite,
      semestre,
    };

    // Only add filiere to update if it was provided
    if (filiere) {
      updateData.filiere = filiere;
    }

    // Update student
    const updatedEtudiant = await Etudiant.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
    .populate('utilisateur')
    .populate('filiere') // Added population for filiere
    .populate('semestre');

    if (!updatedEtudiant) {
      return res.status(404).json({ message: "Étudiant non trouvé." });
    }

    res.status(200).json(updatedEtudiant);

  } catch (error) {
    console.error('Erreur lors de la mise à jour :', error);
    res.status(500).json({ 
      message: "Erreur serveur lors de la mise à jour.",
      error: error.message 
    });
  }
};
// Delete a student
exports.deleteEtudiant = async (req, res) => {
  try {
    const { id } = req.params;

    // Trouver l'étudiant
    const etudiant = await Etudiant.findById(id);
    if (!etudiant) {
      return res.status(404).json({ message: "Étudiant non trouvé." });
    }

    // Supprimer tous les stages associés
    await Stage.deleteMany({ etudiant: id });

    // Supprimer toutes les conventions associées
    await ConventionStage.deleteMany({ etudiant: id });

    // Supprimer tous les rapports de stage associés
    await RapportStage.deleteMany({ etudiant: id });

    // Supprimer l'étudiant
    await Etudiant.findByIdAndDelete(id);

    // Supprimer l'utilisateur associé
    await Utilisateur.findByIdAndDelete(etudiant.utilisateur);

    res.status(200).json({ 
      success: true,
      message: 'Étudiant et données associées supprimés avec succès' 
    });

  } catch (error) {
    console.error('Erreur lors de la suppression :', error);
    res.status(500).json({ 
      success: false,
      message: "Erreur serveur lors de la suppression.",
      error: error.message 
    });
  }
};

// Get student by user ID
exports.getEtudiantByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const etudiant = await Etudiant.findOne({ utilisateur: userId }).populate('utilisateur')
    .populate('filiere');

    if (!etudiant) {
      return res.status(404).json({ message: 'Étudiant non trouvé' });
    }

    res.status(200).json(etudiant);
  } catch (error) {
    console.error('Erreur lors du chargement de l\'étudiant par ID utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
// Get students with EN_ATTENTE status
exports.getEtudiantsEnAttente = async (req, res) => {
  try {
    const etudiants = await Etudiant.find({ 
      statut: 'EN_COURS',
      semestre: await Semestre.findOne({ nom: 'Semestre 4' }).select('_id')
    })
    .populate('utilisateur')
    .populate('semestre')
    .populate('filiere', 'nom'); // Add this line to populate filiere name
    
    if (etudiants.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Aucun étudiant en attente trouvé' 
      });
    }

    res.status(200).json({
      success: true,
      count: etudiants.length,
      etudiants: etudiants
    });

  } catch (error) {
    console.error('Error getting students with EN_ATTENTE status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de la récupération des étudiants en attente',
      error: error.message 
    });
  }
};
exports.updateEtudiantStatus = async (req, res) => {
  try {
    const { id } = req.params; // Cet ID est l'ID de l'utilisateur
    const { statut } = req.body;

    // 1. Trouver d'abord l'étudiant qui a cet utilisateur comme référence
    const etudiant = await Etudiant.findOne({ utilisateur: id });

    if (!etudiant) {
      return res.status(404).json({ message: "Étudiant non trouvé pour cet utilisateur." });
    }

    // 2. Maintenant mettre à jour l'étudiant trouvé
    const updatedEtudiant = await Etudiant.findByIdAndUpdate(
      etudiant._id, // On utilise l'ID de l'étudiant trouvé
      { statut },
      { new: true }
    ).populate('utilisateur');

    res.status(200).json(updatedEtudiant);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut :', error);
    res.status(500).json({ 
      message: "Erreur serveur lors de la mise à jour du statut.",
      error: error.message 
    });
  }
};
exports.getEtudiantById = async (req, res) => {
  try {
    const etudiant = await Etudiant.findById(req.params.id)
      .populate([
        {
          path: 'utilisateur',
          select: 'nom prenom email role'
        },
        {
          path: 'filiere',
          model: 'Filiere',
          select: 'nom'
        }
      ]);

    if (!etudiant) {
      return res.status(404).json({ message: 'Étudiant non trouvé' });
    }

    res.status(200).json(etudiant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
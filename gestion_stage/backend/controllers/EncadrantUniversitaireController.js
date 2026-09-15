const EncadrantUniversitaire = require('../models/EncadrantUniversitaire');
const Utilisateur = require('../models/Utilisateur');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const Stage = require('../models/Stage');
const ConventionStage = require('../models/ConventionStage');



// Get all university supervisors
exports.getEncadrantsUniversitaire = async (req, res) => {
  try {
    const encadrants = await EncadrantUniversitaire.find()
      .populate('utilisateur')
      .populate({
        path: 'filiere',
        select: 'nom' // Only get the 'nom' field from filiere
      });
    
    // Debug: Check the first encadrant's data
    if (encadrants.length > 0) {
      console.log("Sample encadrant data:", {
        _id: encadrants[0]._id,
        filiere: encadrants[0].filiere,
        utilisateur: encadrants[0].utilisateur
      });
    }

    res.json(encadrants);
  } catch (err) {
    console.error("Error fetching encadrants:", err);
    res.status(500).json({ 
      message: 'Server Error',
      error: err.message 
    });
  }
};
// Add a new university supervisor
exports.addEncadrantUniversitaire = async (req, res) => {
  try {
    const {
      nom,
      prenom,
      email,
      specialite,
      filiere,
      telephone,
      password,
      adresse,
      numSomme,
      etablissement,
      universite
    } = req.body;

    // Validate required fields
    if (!nom || !prenom || !email || !numSomme || !password || !filiere) {
      return res.status(400).json({ message: 'Les champs avec * sont obligatoires' });
    }

    // Check if email already exists
    const emailExists = await Utilisateur.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Validate filiere as ObjectId
    if (!mongoose.Types.ObjectId.isValid(filiere)) {
      return res.status(400).json({ message: 'Filière invalide' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const utilisateur = new Utilisateur({
      nom,
      prenom,
      email,
      telephone,
      adresse,
      mdp: hashedPassword,
      role: 'EncadrantUniv'
    });

    await utilisateur.save();

    // Create university supervisor
    const encadrant = new EncadrantUniversitaire({
      specialite,
      filiere,
      numSomme,
      etablissement,
      universite,
      utilisateur: utilisateur._id
    });

    await encadrant.save();

    // Get complete supervisor data with populated user and filiere name
    const completeEncadrant = await EncadrantUniversitaire.findById(encadrant._id)
      .populate('utilisateur')
      .populate({ path: 'filiere', select: 'nom' });

    res.status(201).json({
      success: true,
      message: 'Encadrant universitaire ajouté avec succès',
      encadrant: completeEncadrant
    });

  } catch (err) {
    console.error('Error in addEncadrantUniversitaire:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de l\'ajout',
      error: err.message 
    });
  }
};

// Update a university supervisor
exports.updateEncadrantUniversitaire = async (req, res) => {
  try {
    const { id } = req.params;
   const { specialite, filiere, numSomme, etablissement, universite, utilisateur } = req.body;

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

    // Update university supervisor
    const updatedEncadrant = await EncadrantUniversitaire.findByIdAndUpdate(
      id,
      {
        specialite,
        filiere,
        numSomme,
        etablissement,
        universite,
      },
      { new: true }
    ).populate('utilisateur').populate({
        path: 'filiere',
        select: 'nom' // Only get the 'nom' field from filiere
      });;

    if (!updatedEncadrant) {
      return res.status(404).json({ message: "Encadrant universitaire non trouvé." });
    }

    res.status(200).json(updatedEncadrant);

  } catch (error) {
    console.error('Erreur lors de la mise à jour :', error);
    res.status(500).json({ 
      message: "Erreur serveur lors de la mise à jour.",
      error: error.message 
    });
  }
};

// Delete a university supervisor
exports.deleteEncadrantUniversitaire = async (req, res) => {
  try {
    const { id } = req.params;

    // Trouver l'encadrant
    const encadrant = await EncadrantUniversitaire.findById(id);
    if (!encadrant) {
      return res.status(404).json({ message: "Encadrant universitaire non trouvé." });
    }

    // Supprimer les stages où il est encadrant universitaire
    await Stage.deleteMany({ encadrantUniv: id });

    // Supprimer les conventions où il est encadrant universitaire
    await ConventionStage.deleteMany({ encadrantUniv: id });

    // Supprimer l'encadrant
    await EncadrantUniversitaire.findByIdAndDelete(id);

    // Supprimer l'utilisateur associé
    await Utilisateur.findByIdAndDelete(encadrant.utilisateur);

    res.status(200).json({ 
      success: true,
      message: 'Encadrant universitaire et données associées supprimés avec succès' 
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
exports.getEncadrantUnivByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const encadrant = await EncadrantUniversitaire.findOne({ utilisateur: userId }).populate('utilisateur');

    if (!encadrant) {
      return res.status(404).json({ message: 'Étudiant non trouvé' });
    }

    res.status(200).json(encadrant);
  } catch (error) {
    console.error('Erreur lors du chargement de l\'encadrant par ID utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
exports.getEncadrantUniversitaireByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'ID utilisateur invalide' });
    }

    const encadrant = await EncadrantUniversitaire.findOne({ utilisateur: userId })
      .populate('utilisateur')
      .populate('filiere');

    if (!encadrant) {
      return res.status(404).json({ 
        success: false,
        message: 'Encadrant universitaire non trouvé pour cet utilisateur' 
      });
    }

    res.status(200).json({
      success: true,
      encadrant
    });

  } catch (error) {
    console.error('Error in getEncadrantProfessionnelByUserId:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de la récupération',
      error: error.message 
    });
  }
};
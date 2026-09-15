const EncadrantProfessionnel = require('../models/EncadrantProfessionnel');
const Utilisateur = require('../models/Utilisateur');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const Stage = require('../models/Stage');
const ConventionStage = require('../models/ConventionStage');

// Get all professional supervisors
exports.getEncadrantsProfessionnel = async (req, res) => {
  try {
    const encadrants = await EncadrantProfessionnel.find().populate('utilisateur');
    res.json(encadrants);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Add a new professional supervisor
exports.addEncadrantProfessionnel = async (req, res) => {
  try {
    const { nom, prenom, email, nomOrganisme, fonction, telephone, password,raisonSociale,teleOrganisme,adresse } = req.body;

    // Validate required fields
    if (!nom || !prenom || !email || !password ) {
      return res.status(400).json({ message: ' les champs avec * sont obligatoires' });
    }

    // Check if email already exists
    const emailExists = await Utilisateur.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const utilisateur = new Utilisateur({
      nom,
      prenom,
      email,
      telephone,
      adresse, // Assuming adresse is not provided in the request
      mdp: hashedPassword,
      role: 'EncadrantPro' 
    });

    await utilisateur.save();

    // Create professional supervisor
    const encadrant = new EncadrantProfessionnel({
      nomOrganisme,
      fonction,
      teleOrganisme,
      raisonSociale,
      utilisateur: utilisateur._id
    });

    await encadrant.save();

    // Get complete supervisor data with populated user
    const completeEncadrant = await EncadrantProfessionnel.findById(encadrant._id).populate('utilisateur');

    res.status(201).json({
      success: true,
      message: 'Encadrant professionnel ajouté avec succès',
      encadrant: completeEncadrant
    });

  } catch (err) {
    console.error('Error in addEncadrantProfessionnel:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de l\'ajout',
      error: err.message 
    });
  }
};

// Update a professional supervisor
exports.updateEncadrantProfessionnel = async (req, res) => {
  try {
    const { id } = req.params;
    const { fonction,nomOrganisme,raisonSociale,teleOrganisme, utilisateur } = req.body;

    // Update user
    const updatedUser = await Utilisateur.findByIdAndUpdate(
      utilisateur._id,
      {
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        adresse: utilisateur.adresse,
        telephone: utilisateur.telephone,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    // Update professional supervisor
    const updatedEncadrant = await EncadrantProfessionnel.findByIdAndUpdate(
      id,
      {
        nomOrganisme,
        raisonSociale,
        teleOrganisme,
        fonction
      },
      { new: true }
    ).populate('utilisateur');

    if (!updatedEncadrant) {
      return res.status(404).json({ message: "Encadrant professionnel non trouvé." });
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

// Delete a professional supervisor

exports.deleteEncadrantProfessionnel = async (req, res) => {
  try {
    const { id } = req.params;

    // Trouver l'encadrant
    const encadrant = await EncadrantProfessionnel.findById(id);
    if (!encadrant) {
      return res.status(404).json({ message: "Encadrant professionnel non trouvé." });
    }

    // Supprimer tous les stages liés à cet encadrant
    await Stage.deleteMany({ encadrantPro: id });

    // Supprimer toutes les conventions liées à cet encadrant
    await ConventionStage.deleteMany({ encadrantPro: id });

    // Supprimer l'encadrant professionnel
    await EncadrantProfessionnel.findByIdAndDelete(id);

    // Supprimer l'utilisateur associé
    await Utilisateur.findByIdAndDelete(encadrant.utilisateur);

    res.status(200).json({ 
      success: true,
      message: 'Encadrant professionnel et données associées supprimés avec succès' 
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
// Get university supervisor by user ID
exports.getEncadrantProfessionnelByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'ID utilisateur invalide' });
    }

    const encadrant = await EncadrantProfessionnel.findOne({ utilisateur: userId })
      .populate('utilisateur');

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
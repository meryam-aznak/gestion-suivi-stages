const Utilisateur = require('../models/Utilisateur');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

// Get all presidents
exports.getPresidents = async (req, res) => {
  try {
const presidents = await Utilisateur.find({ role: { $in: ['Doyen', 'Vice doyen'] } });
    res.json(presidents);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Add a new president
exports.addPresident = async (req, res) => {
  try {
    const { nom, prenom, email, telephone, password, adresse, signatureUrl,role } = req.body;

    if (!nom || !prenom || !email || !telephone || !password || !adresse ||!role) {
      return res.status(400).json({ message: 'Remplir les champs obligatoires' });
    }

    const emailExists = await Utilisateur.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const utilisateur = new Utilisateur({
      nom,
      prenom,
      email,
      telephone,
      adresse,
      mdp: hashedPassword,
      role: role,
      signatureUrl: signatureUrl || null
    });

    await utilisateur.save();

    res.status(201).json({
      success: true,
      message: 'Président ajouté avec succès',
      president: utilisateur
    });
  } catch (err) {
    console.error('Erreur lors de l\'ajout du président:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
};

// Update a president
exports.updatePresident = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, email, telephone, adresse, signatureUrl,role } = req.body;

    const updatedUser = await Utilisateur.findOneAndUpdate(
      { _id: id },
      { nom, prenom, email, telephone, adresse, signatureUrl,role },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Président non trouvé." });
    }

    // Adapter la réponse au format que le frontend attend
    res.status(200).json({
      _id: updatedUser._id, // identifiant du président (même que utilisateur)
      utilisateur: updatedUser
    });

  } catch (error) {
    console.error('Erreur update:', error);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};



// Delete a president
exports.deletePresident = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Utilisateur.findOneAndDelete({ _id: id});

    if (!deleted) {
      return res.status(404).json({ message: "Président non trouvé." });
    }

    res.status(200).json({ success: true, message: 'Président supprimé avec succès' });

  } catch (error) {
    console.error('Erreur suppression:', error);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

// Get president by ID
exports.getPresidentById = async (req, res) => {
  try {
    const { id } = req.params;

    const president = await Utilisateur.findOne({ _id: id });

    if (!president) {
      return res.status(404).json({ message: "Président non trouvé." });
    }

    res.status(200).json(president);

  } catch (error) {
    console.error('Erreur récupération:', error);
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
  }
};

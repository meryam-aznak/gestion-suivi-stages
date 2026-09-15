const Utilisateur = require('../models/Utilisateur');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.login = async (req, res) => {
  try {
    const { email, mdp } = req.body;

    // Validation
    if (!email || !mdp) {
      return res.status(400).json({ message: 'Email et mot de passe sont requis' });
    }

    // Find user
    const utilisateur = await Utilisateur.findOne({ email });
    if (!utilisateur) {
      return res.status(401).json({ message: 'Informations d\'identification invalides' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(mdp, utilisateur.mdp);
    if (!isMatch) {
      return res.status(401).json({ message: 'Informations d\'identification invalides' });
    }

    // Create JWT token (expires in 1 day)
    const token = jwt.sign(
      {
        id: utilisateur._id,
        email: utilisateur.email,
        role: utilisateur.role
      },
      process.env.JWT_SECRET || 'your_fallback_secret',
      { expiresIn: '1d' }
    );

    // Return user data without password
    const userData = {
      _id: utilisateur._id,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email,
      role: utilisateur.role,
      createdAt: utilisateur.createdAt,
      updatedAt: utilisateur.updatedAt
    };

    res.status(200).json({
      message: 'Login successful',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Simple token verification function you can use directly in routes
exports.verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_fallback_secret');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token' });
  }
};
exports.updatePassword = async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;

  try {
    const utilisateur = await Utilisateur.findById(userId);
    if (!utilisateur) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, utilisateur.mdp);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mot de passe actuel incorrect.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    utilisateur.mdp = hashedPassword;
    await utilisateur.save();

    res.status(200).json({ message: 'Mot de passe mis à jour avec succès.' });
  } catch (error) {
    console.error('Erreur de mise à jour du mot de passe:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
exports.initiateReset = async (req, res) => {
  try {
    const { email } = req.body;

    const utilisateur = await Utilisateur.findOne({ email });
    if (!utilisateur) {
      return res.status(404).json({ message: 'Aucun utilisateur trouvé avec cet email.' });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = await bcrypt.hash(verificationCode, 10);

    utilisateur.resetPasswordToken = hashedCode;
    utilisateur.resetPasswordExpires = Date.now() + 3600000; // 1 heure
    await utilisateur.save();

    // En dev, on retourne le code pour EmailJS
    res.status(200).json({ 
      message: 'Code généré',
      code: verificationCode 
    });
  } catch (error) {
    console.error('Erreur reset init:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    const utilisateur = await Utilisateur.findOne({ 
      email,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!utilisateur || !utilisateur.resetPasswordToken) {
      return res.status(400).json({ message: 'Code invalide ou expiré' });
    }

    const isMatch = await bcrypt.compare(code, utilisateur.resetPasswordToken);
    if (!isMatch) {
      return res.status(400).json({ message: 'Code invalide' });
    }

    res.status(200).json({ message: 'Code vérifié' });
  } catch (error) {
    console.error('Erreur vérification:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    const utilisateur = await Utilisateur.findOne({ 
      email,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!utilisateur || !utilisateur.resetPasswordToken) {
      return res.status(400).json({ message: 'Lien invalide ou expiré' });
    }

    const isMatch = await bcrypt.compare(code, utilisateur.resetPasswordToken);
    if (!isMatch) {
      return res.status(400).json({ message: 'Code invalide' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    utilisateur.mdp = hashedPassword;
    utilisateur.resetPasswordToken = undefined;
    utilisateur.resetPasswordExpires = undefined;
    await utilisateur.save();

    res.status(200).json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('Erreur réinitialisation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
exports.updateUtilisateur = async (req, res) => {
  const { id } = req.params;
  const { nom, prenom, telephone, adresse } = req.body; // Remove role from here for profile updates

  try {
    const utilisateur = await Utilisateur.findById(id);
    if (!utilisateur) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // Update allowed fields (remove role update for regular profile updates)
    if (nom !== undefined) utilisateur.nom = nom;
    if (prenom !== undefined) utilisateur.prenom = prenom;
    if (telephone !== undefined) utilisateur.telephone = telephone;
    if (adresse !== undefined) utilisateur.adresse = adresse;

    await utilisateur.save();

    // Return updated user data (without password)
    const userData = {
      _id: utilisateur._id,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email,
      telephone: utilisateur.telephone,
      adresse: utilisateur.adresse,
      role: utilisateur.role,
      createdAt: utilisateur.createdAt,
      updatedAt: utilisateur.updatedAt
    };

    res.status(200).json({ 
      message: 'Utilisateur mis à jour avec succès.', 
      user: userData 
    });
  } catch (error) {
    console.error('Erreur mise à jour utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour.' });
  }
};


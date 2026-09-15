const mongoose = require('mongoose');

const utilisateurSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  telephone: { type: String },
  mdp: { type: String, required: true },
  adresse: { type: String },
  role: { 
    type: String, 
    enum: ['Etudiant', 'EncadrantPro', 'EncadrantUniv', 'Administrateur', 'Doyen', 'Vice doyen'], 
    required: true 
  },
  signatureUrl: { type: String, default: null },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Utilisateur', utilisateurSchema);

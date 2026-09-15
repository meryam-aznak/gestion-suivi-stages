const mongoose = require('mongoose');

const encadrantUniversitaireSchema = new mongoose.Schema({
  specialite: { type: String },
  filiere: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Filiere', 
    required: true 
  },  numSomme: { type: String, required: true },
  etablissement: { type: String },
  universite: { type: String},
  utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true }
}, { timestamps: true });

const EncadrantUniversitaire = mongoose.model('EncadrantUniversitaire', encadrantUniversitaireSchema);
module.exports = EncadrantUniversitaire;

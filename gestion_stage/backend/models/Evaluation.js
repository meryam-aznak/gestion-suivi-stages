const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
  note: { type: String, required: true },
  commentaires: { type: String },
  etudiant: { type: mongoose.Schema.Types.ObjectId, ref: 'Etudiant', required: true },
  evaluateur: { type: mongoose.Schema.Types.ObjectId, refPath: 'evaluateurModel' }, // flexible reference
  evaluateurModel: { type: String, enum: ['EncadrantUniversitaire', 'EncadrantProfessionnel'] }
}, { timestamps: true });

// Prevent OverwriteModelError by checking if the model already exists
module.exports = mongoose.models.Evaluation || mongoose.model('Evaluation', evaluationSchema);

const mongoose = require('mongoose');

const ficheLaureatSchema = new mongoose.Schema({
  emploiActuel: { type: String, required: true },
  entreprise: { type: String, required: true },
  feedbackFormation: { type: String },
  etudiant: { type: mongoose.Schema.Types.ObjectId, ref: 'Etudiant', required: true }
}, { timestamps: true });

const FicheLaureat = mongoose.model('FicheLaureat', ficheLaureatSchema);
module.exports = FicheLaureat;

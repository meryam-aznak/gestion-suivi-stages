const mongoose = require('mongoose');

const rapportStageSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  urlDocument: { type: String, required: true },
  dateSoumission: { type: Date, default: Date.now },
  etudiant: { type: mongoose.Schema.Types.ObjectId, ref: 'Etudiant', required: true }
}, { timestamps: true });

const RapportStage = mongoose.model('RapportStage', rapportStageSchema);
module.exports = RapportStage;

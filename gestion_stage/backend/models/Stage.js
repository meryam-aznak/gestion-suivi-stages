const mongoose = require('mongoose');

const stageSchema = new mongoose.Schema({
  sujet: { type: String},
  dateDebut: { type: Date },
  dateFin: { type: Date},
statut: { type: String, default: 'EN_ATTENTE' },
  nature: {type: String, 
nature: {
  type: String,
  enum: ['Stage de recherche', 'Stage de Fin d Etude', null],
  default: null,
  required: false
}
  },
  Objectifs :{ type: String },
  horaire:{ type: String},
  etudiant: { type: mongoose.Schema.Types.ObjectId, ref: 'Etudiant', required: true },
  encadrantUniv: { type: mongoose.Schema.Types.ObjectId, ref: 'EncadrantUniversitaire' },
  encadrantPro: { type: mongoose.Schema.Types.ObjectId, ref: 'EncadrantProfessionnel' }
}, { timestamps: true });
const Stage = mongoose.model('Stage', stageSchema);
module.exports = Stage;
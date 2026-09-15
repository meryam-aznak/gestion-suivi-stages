const mongoose = require('mongoose');

const conventionStageSchema = new mongoose.Schema({
  dateCreation: { type: Date, default: Date.now },
  urlDocument: { type: String, required: true },
  etatConvention: { 
    type: String, 
    enum: ['Valide', 'Non Valide', 'En cours'], 
    default: 'En cours' 
  },
  encadrantUnivSigne: { type: Boolean, default: false },  
  encadrantProSigne: { type: Boolean, default: false } ,   
  etudiant: { type: mongoose.Schema.Types.ObjectId, ref: 'Etudiant', required: true },
  encadrantUniv: { type: mongoose.Schema.Types.ObjectId, ref: 'EncadrantUniversitaire' },
  encadrantPro: { type: mongoose.Schema.Types.ObjectId, ref: 'EncadrantProfessionnel' }
}, { timestamps: true });


const ConventionStage = mongoose.model('ConventionStage', conventionStageSchema);
module.exports = ConventionStage;

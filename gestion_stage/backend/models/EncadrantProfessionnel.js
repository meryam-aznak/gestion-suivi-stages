const mongoose = require('mongoose');

const encadrantProfessionnelSchema = new mongoose.Schema({
  fonction: { type: String },
  raisonSociale : { type: String },
  nomOrganisme : { type: String },
  teleOrganisme: { type: String },
  utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true }
}, { timestamps: true });

const EncadrantProfessionnel = mongoose.model('EncadrantProfessionnel', encadrantProfessionnelSchema);
module.exports = EncadrantProfessionnel;

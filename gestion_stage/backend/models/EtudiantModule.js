const mongoose = require('mongoose');

const etudiantModuleSchema = new mongoose.Schema({
  etudiant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Etudiant', required: true },
  module_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
  note: { type: Number, required: true },
  valide: { type: Boolean, default: false }
});

module.exports = mongoose.model('EtudiantModule', etudiantModuleSchema);
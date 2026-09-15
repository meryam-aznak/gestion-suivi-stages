const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  nom_module: { type: String, required: true },
  semestre_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Semestre', required: true }
});

module.exports = mongoose.model('Module', moduleSchema);
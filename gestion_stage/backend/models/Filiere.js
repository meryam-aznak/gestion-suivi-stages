const mongoose = require('mongoose');

// First, create the Filiere schema
const filiereSchema = new mongoose.Schema({
  nom: { type: String, required: true, unique: true },
}, { timestamps: true });

const Filiere = mongoose.model('Filiere', filiereSchema);
module.exports = Filiere;
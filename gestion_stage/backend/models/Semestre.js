const mongoose = require('mongoose');

const semestreSchema = new mongoose.Schema({
  nom: { type: String, required: true },        // Ex: "S1"
  niveau: { type: String, required: true },     // Ex: "Licence", "Master"
});

module.exports = mongoose.model('Semestre', semestreSchema);
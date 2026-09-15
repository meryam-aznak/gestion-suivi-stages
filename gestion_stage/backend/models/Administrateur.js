const mongoose = require('mongoose');

const administrateurSchema = new mongoose.Schema({
  utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true }
}, { timestamps: true });

const Administrateur = mongoose.model('Administrateur', administrateurSchema);
module.exports = Administrateur;

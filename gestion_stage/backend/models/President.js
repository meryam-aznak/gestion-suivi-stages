const mongoose = require('mongoose');
const PresidentSchema = new mongoose.Schema({
  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },
  // You might add president-specific fields here
}, { timestamps: true });

module.exports = mongoose.model('President', PresidentSchema);
const mongoose = require('mongoose');


// Then modify the Etudiant schema to reference Filiere
const etudiantSchema = new mongoose.Schema({
  codeApogee: { type: String, required: true, unique: true },
  filiere: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Filiere', 
    required: true 
  },
  promotion: { type: String },
  statut: { 
    type: String, 
    enum: ['EN_STAGE', 'EN_COURS', 'LAUREAT', 'EN_ATTENTE'] 
  },
  dateNaissance: { type: Date },
  numSecurite: { type: String },
  utilisateur: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Utilisateur', 
    required: true 
  },
  semestre: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Semestre' 
  }
}, { timestamps: true });


const Etudiant = mongoose.model('Etudiant', etudiantSchema);
module.exports = Etudiant;

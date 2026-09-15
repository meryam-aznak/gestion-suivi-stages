// controllers/RapportStageController.js
const fs = require('fs');
const RapportStage = require('../models/RapportStage');
const Notification = require('../models/Notification');
const Etudiant = require('../models/Etudiant');
const Stage = require('../models/Stage');
const mongoose = require('mongoose');

const deposerRapport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier reçu' });
    }

    const { titre, etudiant } = req.body;

    // Supprimer ancien rapport s'il existe
    const ancienRapport = await RapportStage.findOne({ etudiant });
    if (ancienRapport) {
      const oldFilePath = ancienRapport.urlDocument;
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
      await RapportStage.deleteOne({ _id: ancienRapport._id });
    }

    // Enregistrer le nouveau rapport
    const nouveauRapport = new RapportStage({
      urlDocument: req.file.path,
      titre,
      etudiant
    });

    await nouveauRapport.save();

    // Notification à l'encadrant universitaire
   /* const etudiantDoc = await Etudiant.findById(etudiant).populate('encadrantUniv');
    if (etudiantDoc?.encadrantUniv?.utilisateur) {
      const notification = await Notification.create({
        userId: etudiantDoc.encadrantUniv.utilisateur,
        type: 'rapport',
        message: 'Un nouveau rapport de stage a été déposé.'
      });

      // Make sure sendNotificationToClient is imported/defined
      if (typeof sendNotificationToClient === 'function') {
        sendNotificationToClient(etudiantDoc.encadrantUniv.utilisateur.toString(), notification);
      }
    }*/

    res.status(201).json({
      message: 'Rapport de stage déposé avec succès',
      rapport: nouveauRapport
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur lors du dépôt du rapport de stage' });
  }
};
// GET /api/rapport/etudiant/:id
const getRapportByEtudiant = async (req, res) => {
  try {
    const rapport = await RapportStage.findOne({ etudiant: req.params.id });
    if (!rapport) return res.status(404).json({ message: 'Aucun rapport trouvé' });
    res.json(rapport);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};



const getRapportsByEncadrantUniv = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate encadrant ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID encadrant universitaire invalide' });
    }

    // Get all students supervised by this encadrant
    const stages = await Stage.find({ encadrantUniv: id }).select('etudiant');

    const etudiantIds = stages.map(stage => stage.etudiant);

    // Return empty array if no students found (not an error)
    if (etudiantIds.length === 0) {
      return res.status(200).json([]);
    }

    // Get all reports for those students with populated student info
    const rapports = await RapportStage.find({ etudiant: { $in: etudiantIds } })
      .populate({
        path: 'etudiant',
        select: 'codeApogee promotion filiere',
        populate: [
          {
            path: 'utilisateur',
            select: 'nom prenom'
          },
          {
            path: 'filiere',
            select: 'nom'
          }
        ]
      })
      .sort({ createdAt: -1 });

    // Transform the response to include filiere name directly
    const transformedRapports = rapports.map(rapport => {
      return {
        ...rapport.toObject(),
        etudiant: {
          ...rapport.etudiant.toObject(),
          filiere: rapport.etudiant.filiere?.nom || null,
          promotion: rapport.etudiant.promotion || null
        }
      };
    });

    res.json(transformedRapports);
  } catch (error) {
    console.error('Error in getRapportsByEncadrantUniv:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la récupération des rapports',
      error: error.message 
    });
  }
};
const getRapportsByEncadrantPro = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate encadrant ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID encadrant professionnel invalide' });
    }

    // Get all students supervised by this professional encadrant
    const stages = await Stage.find({ encadrantPro: id }).select('etudiant');

    const etudiantIds = stages.map(stage => stage.etudiant);

    // Return empty array if no students found (not an error)
    if (etudiantIds.length === 0) {
      return res.status(200).json([]);
    }

    // Get all reports for those students with populated student info
    const rapports = await RapportStage.find({ etudiant: { $in: etudiantIds } })
      .populate({
        path: 'etudiant',
        select: 'codeApogee promotion filiere',
        populate: [
          {
            path: 'utilisateur',
            select: 'nom prenom'
          },
          {
            path: 'filiere',
            select: 'nom'
          }
        ]
      })
      .sort({ createdAt: -1 });

    // Transform the response to include filiere name directly
    const transformedRapports = rapports.map(rapport => {
      return {
        ...rapport.toObject(),
        etudiant: {
          ...rapport.etudiant.toObject(),
          filiere: rapport.etudiant.filiere?.nom || null,
          promotion: rapport.etudiant.promotion || null
        }
      };
    });

    res.json(transformedRapports);
  } catch (error) {
    console.error('Error in getRapportsByEncadrantPro:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la récupération des rapports',
      error: error.message 
    });
  }
};

module.exports = {
  deposerRapport,
  getRapportByEtudiant,
  getRapportsByEncadrantUniv,
  getRapportsByEncadrantPro
};
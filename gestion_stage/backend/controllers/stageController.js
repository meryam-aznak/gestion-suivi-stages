const Stage = require('../models/Stage');
const Etudiant = require('../models/Etudiant');
const EncadrantUniversitaire = require('../models/EncadrantUniversitaire');
const EncadrantProfessionnel = require('../models/EncadrantProfessionnel');
const mongoose = require('mongoose');  // Add this line at the top of your file
const Notification = require('../models/Notification');
const ConventionStage = require('../models/ConventionStage');
const RapportStage = require('../models/RapportStage');
const Evaluation = require('../models/Evaluation');
// Helper function for error responses
const errorResponse = (res, status, message, error = null) => {
  return res.status(status).json({
    success: false,
    message,
    error: error?.message || null
  });
};
const successResponse = (res, status, message, data = null) => {
  return res.status(status).json({
    success: true,
    message,
    data
  });
};
// Get all stages with population
exports.getAllStages = async (req, res) => {
  try {
    const stages = await Stage.find()
      .populate({
        path: 'etudiant',
        select: 'nom prenom email telephone promotion filiere',
        populate: [
          {
            path: 'utilisateur',
            select: 'nom prenom email telephone'
          },
          {
            path: 'filiere',
            select: 'nom'
          }
        ]
      })
      .populate({
        path: 'encadrantUniv',
        select: 'nom prenom email telephone specialite etablissement universite filiere',
        populate: [
          {
            path: 'utilisateur',
            select: 'nom prenom email telephone'
          },
          {
            path: 'filiere',
            select: 'nom'
          }
        ]
      })
      .populate({
        path: 'encadrantPro',
        select: 'nom prenom email telephone fonction nomOrganisme teleOrganisme raisonSociale',
        populate: {
          path: 'utilisateur',
          select: 'nom prenom email telephone'
        }
      })
      .sort({ createdAt: -1 });

    const studentIds = stages.map(stage => stage.etudiant._id);

    const [conventions, rapports, evaluations] = await Promise.all([
      ConventionStage.find({ etudiant: { $in: studentIds } }),
      RapportStage.find({ etudiant: { $in: studentIds } }),
      Evaluation.find({ etudiant: { $in: studentIds } })
        .populate({
          path: 'evaluateur',
          populate: {
            path: 'utilisateur',
            select: 'nom prenom'
          }
        })
    ]);

    const studentConventions = conventions.reduce((acc, conv) => {
      if (!acc[conv.etudiant]) acc[conv.etudiant] = [];
      acc[conv.etudiant].push(conv);
      return acc;
    }, {});

    const studentRapports = rapports.reduce((acc, rapport) => {
      if (!acc[rapport.etudiant]) acc[rapport.etudiant] = [];
      acc[rapport.etudiant].push(rapport);
      return acc;
    }, {});

    const studentEvaluations = evaluations.reduce((acc, eval) => {
      if (!acc[eval.etudiant]) acc[eval.etudiant] = [];

      const transformedEval = {
        ...eval.toObject(),
        evaluatorName: getEvaluatorName(eval.evaluateur)
      };

      acc[eval.etudiant].push(transformedEval);
      return acc;
    }, {});

    function getEvaluatorName(evaluateur) {
      if (!evaluateur) return 'Inconnu';
      if (evaluateur.utilisateur) {
        return `${evaluateur.utilisateur.nom} ${evaluateur.utilisateur.prenom}`;
      }
      return `${evaluateur.nom || 'Inconnu'} ${evaluateur.prenom || ''}`;
    }

    const transformedStages = stages.map(stage => {
      const studentId = stage.etudiant?._id?.toString();

      return {
        _id: stage._id,
        sujet: stage.sujet || 'Non spécifié',
        dateDebut: stage.dateDebut || null,
        dateFin: stage.dateFin || null,
        statut: stage.statut || 'EN_ATTENTE',
        nature: stage.nature || 'Non spécifiée',
        Objectifs: stage.Objectifs || '',
        horaire: stage.horaire || '',
        etudiant: stage.etudiant ? {
          _id: stage.etudiant._id,
          nom: stage.etudiant.utilisateur?.nom || stage.etudiant.nom || 'Inconnu',
          prenom: stage.etudiant.utilisateur?.prenom || stage.etudiant.prenom || '',
          email: stage.etudiant.utilisateur?.email || stage.etudiant.email || '',
          telephone: stage.etudiant.utilisateur?.telephone || stage.etudiant.telephone || '',
          promotion: stage.etudiant.utilisateur?.promotion || stage.etudiant.promotion || '',
          filiere: stage.etudiant.filiere ? {
            _id: stage.etudiant.filiere._id,
            nom: stage.etudiant.filiere.nom || 'Non spécifiée'
          } : null
        } : null,
        encadrantUniv: stage.encadrantUniv ? {
          _id: stage.encadrantUniv._id,
          nom: stage.encadrantUniv.utilisateur?.nom || stage.encadrantUniv.nom || 'Inconnu',
          prenom: stage.encadrantUniv.utilisateur?.prenom || stage.encadrantUniv.prenom || '',
          email: stage.encadrantUniv.utilisateur?.email || stage.encadrantUniv.email || '',
          telephone: stage.encadrantUniv.utilisateur?.telephone || stage.encadrantUniv.telephone || '',
          specialite: stage.encadrantUniv.utilisateur?.specialite || stage.encadrantUniv.specialite || '',
          etablissement: stage.encadrantUniv.utilisateur?.etablissement || stage.encadrantUniv.etablissement || '',
          universite: stage.encadrantUniv.utilisateur?.universite || stage.encadrantUniv.universite || '',
          filiere: stage.encadrantUniv.filiere ? {
            _id: stage.encadrantUniv.filiere._id,
            nom: stage.encadrantUniv.filiere.nom || 'Non spécifiée'
          } : null
        } : null,
        encadrantPro: stage.encadrantPro ? {
          _id: stage.encadrantPro._id,
          nom: stage.encadrantPro.utilisateur?.nom || stage.encadrantPro.nom || 'Inconnu',
          prenom: stage.encadrantPro.utilisateur?.prenom || stage.encadrantPro.prenom || '',
          email: stage.encadrantPro.utilisateur?.email || stage.encadrantPro.email || '',
          telephone: stage.encadrantPro.utilisateur?.telephone || stage.encadrantPro.telephone || '',
          fonction: stage.encadrantPro.utilisateur?.fonction || stage.encadrantPro.fonction || '',
          nomOrganisme: stage.encadrantPro.utilisateur?.nomOrganisme || stage.encadrantPro.nomOrganisme || '',
          teleOrganisme: stage.encadrantPro.utilisateur?.teleOrganisme || stage.encadrantPro.teleOrganisme || '',
          raisonSociale: stage.encadrantPro.utilisateur?.raisonSociale || stage.encadrantPro.raisonSociale || ''
        } : null,
        convention: studentId ? (studentConventions[studentId] || []) : [],
        rapport: studentId ? (studentRapports[studentId] || []) : [],
        evaluation: studentId ? (studentEvaluations[studentId] || []) : [],
        createdAt: stage.createdAt,
        updatedAt: stage.updatedAt
      };
    });

    res.status(200).json({ success: true, data: transformedStages });
  } catch (error) {
    errorResponse(res, 500, 'Error fetching stages', error);
  }
};


// Get stage by ID with population
exports.getStageById = async (req, res) => {
  try {
    const stage = await Stage.findById(req.params.id)
      .populate('etudiant')
      .populate('encadrantUniv')
      .populate('encadrantPro');  // Fixed from encadrantProf to encadrantPro
      
    if (!stage) {
      return errorResponse(res, 404, 'Stage not found');
    }
    res.status(200).json({ success: true, data: stage });
  } catch (error) {
    errorResponse(res, 500, 'Error fetching stage', error);
  }
};


const { sendNotificationToClient } = require('../routes/Notification'); // 👈 import it

exports.createStage = async (req, res) => {
  try {
    const { etudiantId, encadrantUnivId, encadrantProId, ...stageData } = req.body;

    const existingStage = await Stage.findOne({ etudiant: etudiantId });
    if (existingStage) {
      return errorResponse(res, 400, 'Cet étudiant a déjà un stage attribué');
    }

    const newStage = new Stage({
      ...stageData,
      etudiant: etudiantId,
      encadrantUniv: encadrantUnivId,
      encadrantPro: encadrantProId || null
    });

    await newStage.save();

    await Etudiant.findByIdAndUpdate(
      etudiantId,
      { statut: 'EN_ATTENTE' },
      { new: true, runValidators: true }
    );

    // 🔔 Create notification for the student
    const studentUserId = (await Etudiant.findById(etudiantId)).utilisateur; // assuming relation exists
    const studentNotification = await Notification.create({
      userId: studentUserId,
      message: encadrantProId
        ? 'Un encadrant universitaire et un encadrant professionnel vous ont été assignés.'
        : 'Un encadrant universitaire vous a été assigné.',
      type: 'stage'
    });
    sendNotificationToClient(studentUserId.toString(), studentNotification);

    // 🔔 Notify Encadrant Univ
    const univUser = await EncadrantUniversitaire.findById(encadrantUnivId).populate('utilisateur');
    const notifUniv = await Notification.create({
      userId: univUser.utilisateur._id,
      message: "Vous avez été assigné à un étudiant.",
      type: 'stage'
    });
    sendNotificationToClient(univUser.utilisateur._id.toString(), notifUniv);

    // 🔔 Notify Encadrant Pro (if provided)
    if (encadrantProId) {
      const proUser = await EncadrantProfessionnel.findById(encadrantProId).populate('utilisateur');
      const notifPro = await Notification.create({
        userId: proUser.utilisateur._id,
        message: "Vous avez été assigné à un étudiant.",
        type: 'stage'
      });
      sendNotificationToClient(proUser.utilisateur._id.toString(), notifPro);
    }

    return successResponse(res, 201, 'Stage créé avec succès', newStage);
  } catch (error) {
    return errorResponse(res, 500, 'Erreur lors de la création du stage', error);
  }
};


// Update stage without required field validation
exports.updateStage = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate stage exists
    const stage = await Stage.findById(id);
    if (!stage) {
      return res.status(404).json({
        success: false,
        message: 'Stage non trouvé'
      });
    }

    // Perform the update
    const updatedStage = await Stage.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    })
    .populate({
      path: 'etudiant',
      populate: { path: 'utilisateur' }
    })
    .populate({
      path: 'encadrantUniv',
      populate: { path: 'utilisateur' }
    })
    .populate({
      path: 'encadrantPro',
      populate: { path: 'utilisateur' }
    });

    res.status(200).json({
      success: true,
      message: 'Stage mis à jour avec succès',
      data: updatedStage
    });

  } catch (error) {
    console.error('Error updating stage:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour du stage',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete stage
exports.deleteStage = async (req, res) => {
  try {
    const { id } = req.params;

    const stage = await Stage.findByIdAndDelete(id);
    if (!stage) {
      return errorResponse(res, 404, 'Stage not found');
    }

    const etudiantId = stage.etudiant;

    // Update student status back to available
    if (etudiantId) {
      await Etudiant.findByIdAndUpdate(etudiantId, { statut: 'EN_COURS' });

      // Delete related ConventionStage
      await ConventionStage.deleteMany({ etudiant: etudiantId });

      // Delete related RapportStage
      await RapportStage.deleteMany({ etudiant: etudiantId });
    }

    res.status(200).json({
      success: true,
      message: 'Stage, convention, and rapport supprimés avec succès'
    });

  } catch (error) {
    errorResponse(res, 500, 'Error deleting stage', error);
  }
};
// Add this new controller function to your existing exports


exports.getStageByStudentId = async (req, res) => {
    try {
        const { studentId } = req.params;

        // Validate if studentId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(studentId)) {
            return res.status(400).json({
                success: false,
                message: 'ID étudiant invalide'
            });
        }
        const stage = await Stage.findOne({ etudiant: studentId })
        .populate({
          path: 'encadrantPro',
          populate: {
            path: 'utilisateur',
            model: 'Utilisateur',
            select: 'nom prenom email telephone adresse'  // Assure-toi de bien sélectionner les champs nécessaires
          }
        })
        .populate({
          path: 'etudiant',
          populate: {
            path: 'utilisateur',
            model: 'Utilisateur',
            select: 'nnom prenom email telephone adresse'
          }
        })
       .populate({
        path: 'encadrantUniv',
       populate: [{
          path: 'utilisateur',
          model: 'Utilisateur',
          select: 'nom prenom email telephone adresse universite etablissement'
        },
          {
            path: 'filiere',
            model: 'Filiere',
            select: 'nom'
          }]
      });
      

        if (!stage) {
            return res.status(404).json({
                success: false,
                message: `Aucun stage trouvé pour l'étudiant ${studentId}`
            });
        }

        res.status(200).json({ success: true, data: stage });

    } catch (error) {
        console.error("Erreur getStageByStudentId:", error);
        res.status(500).json({
            success: false,
            message: "Erreur serveur",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
// controllers/stageController.js
// ou chemin correct vers le modèle
exports.assignEncadrantProToStage = async (req, res) => {
  const { studentId } = req.params;
  const {
    encadrantProId,
    dateDebut,
    dateFin,
    horaire,
    sujet
  } = req.body;

  try {
    const stage = await Stage.findOne({ etudiant: studentId }).populate('etudiant');

    if (!stage) {
      return res.status(404).json({
        success: false,
        message: "Stage introuvable pour cet étudiant."
      });
    }

    // Update stage info
    stage.encadrantPro = encadrantProId;
    if (dateDebut) stage.dateDebut = dateDebut;
    if (dateFin) stage.dateFin = dateFin;
    if (horaire) stage.horaire = horaire;
    if (sujet) stage.sujet = sujet;

    await stage.save();

    // ✅ Get utilisateur IDs for notifications
    const encadrantPro = await EncadrantProfessionnel.findById(encadrantProId);
    const encadrantProUserId = encadrantPro?.utilisateur; // Assumes relation

    const etudiant = await Etudiant.findById(studentId);
    const etudiantUserId = etudiant?.utilisateur;

    // 🔔 Notify encadrant professionnel
   if (encadrantProUserId) {
  const notification = await new Notification({
    userId: encadrantProUserId,
    message: 'Vous avez été assigné à un nouveau stage en tant qu\'encadrant professionnel.',
    type: 'stage',
    relatedId: stage._id,
    read: false,
  }).save();

  sendNotificationToClient(encadrantProUserId.toString(), notification); // 👈 temps réel
}

if (etudiantUserId) {
  const notification = await new Notification({
    userId: etudiantUserId,
    message: 'Un encadrant professionnel vous a été assigné pour votre stage.',
    type: 'stage',
    relatedId: stage._id,
    read: false,
  }).save();

  sendNotificationToClient(etudiantUserId.toString(), notification); // 👈 temps réel
}


    res.status(200).json({
      success: true,
      message: 'Encadrant assigné et informations de stage mises à jour avec succès.',
      data: stage
    });

  } catch (error) {
    console.error("Erreur d'affectation:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'affectation.",
      error: error.message
    });
  }
};

exports.getStagesByEncadrantUnivId = async (req, res) => {
  try {
    const { encadrantUnivId } = req.params;

    const stages = await Stage.find({ encadrantUniv: encadrantUnivId })
      .populate({
        path: 'encadrantPro',
        populate: {
          path: 'utilisateur',
          model: 'Utilisateur',
          select: 'nom prenom email telephone adresse'
        }
      })
      .populate({
        path: 'etudiant',
        populate: [
          {
            path: 'utilisateur',
            model: 'Utilisateur',
            select: 'nom prenom email telephone adresse'
          },
          {
            path: 'filiere',  // Add this population for filiere
            model: 'Filiere',
            select: 'nom'
          }
        ]
      })
      .populate({
        path: 'encadrantUniv',
       populate: [{
          path: 'utilisateur',
          model: 'Utilisateur',
          select: 'nom prenom email telephone adresse universite etablissement'
        },
          {
            path: 'filiere',
            model: 'Filiere',
            select: 'nom'
          }]
      });

    if (!stages || stages.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Aucun stage trouvé pour cet encadrant universitaire."
      });
    }

    res.status(200).json({
      success: true,
      data: stages
    });

  } catch (error) {
    console.error("Erreur dans getStagesByEncadrantUnivId:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des stages.",
      error: error.message
    });
  }
};
exports.getStagesByEncadrantProId = async (req, res) => {
  try {
    const { encadrantProId } = req.params;

    const stages = await Stage.find({ encadrantPro: encadrantProId })
      .populate({
        path: 'encadrantPro',
        populate: {
          path: 'utilisateur',
          model: 'Utilisateur',
          select: 'nom prenom email telephone adresse'
        }
      })
      .populate({
        path: 'etudiant',
        populate: [
          {
            path: 'utilisateur',
            model: 'Utilisateur',
            select: 'nom prenom email telephone adresse'
          },
          {
            path: 'filiere',
            model: 'Filiere',
            select: 'nom'
          }
        ]
      })
      .populate({
        path: 'encadrantUniv',
        populate: [{
          path: 'utilisateur',
          model: 'Utilisateur',
          select: 'nom prenom email telephone adresse universite etablissement'
        },
          {
            path: 'filiere',
            model: 'Filiere',
            select: 'nom'
          }]
      });

    if (!stages || stages.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Aucun stage trouvé pour cet encadrant professionnel."
      });
    }

    res.status(200).json({
      success: true,
      data: stages
    });

  } catch (error) {
    console.error("Erreur dans getStagesByEncadrantProId:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des stages.",
      error: error.message
    });
  }
};
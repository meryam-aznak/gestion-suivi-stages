// controllers/dashboardController.js
const Etudiant = require('../models/Etudiant');
const EncadrantUniversitaire = require('../models/EncadrantUniversitaire');

exports.getDashboardStats = async (req, res) => {
  try {
    const studentsInStage = await Etudiant.countDocuments({ statut: 'EN_STAGE' });
    const availableMentors = await EncadrantUniversitaire.countDocuments();
    const laureats = await Etudiant.countDocuments({ statut: 'LAUREAT' });

    const statusStats = await Etudiant.aggregate([
      { $group: { _id: '$statut', count: { $sum: 1 } } }
    ]);

    const promotionStats = await Etudiant.aggregate([
      { $match: { statut: 'LAUREAT' } },
      { $group: { _id: '$promotion', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      studentsInStage,
      availableMentors,
      laureats,
      statusStats,
      promotionStats
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

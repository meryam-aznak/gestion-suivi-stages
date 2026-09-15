const Semestre = require('../models/Semestre.js'); 
exports.getMasterSemestres = async (req, res) => {
    try {
      const masterSemestres = await Semestre.find({ niveau: 'Master' });
      
      // Modified response structure
      res.status(200).json({
        success: true,
        data: masterSemestres // Directly return the array
      });
      
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
};
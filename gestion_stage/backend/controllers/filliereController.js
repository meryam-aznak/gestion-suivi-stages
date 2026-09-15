const Filiere = require('../models/Filiere.js'); 

// Add a new filiere
exports.addFiliere = async (req, res) => {
  try {
    const { nom } = req.body;
    
    if (!nom) {
      return res.status(400).json({ message: 'Nom is required' });
    }

    const existingFiliere = await Filiere.findOne({ nom });
    if (existingFiliere) {
      return res.status(400).json({ message: 'Filiere with this name already exists' });
    }

    const newFiliere = new Filiere({ nom });
    await newFiliere.save();

    res.status(201).json({
      message: 'Filiere crée avec succès',
      filiere: newFiliere
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error creating filiere',
      error: error.message 
    });
  }
};

// Get all filieres
exports.getAllFilieres = async (req, res) => {
  try {
    const filieres = await Filiere.find().sort({ createdAt: -1 });
    res.status(200).json(filieres);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching filieres',
      error: error.message 
    });
  }
};

// Update a filiere
exports.updateFiliere = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom } = req.body;

    if (!nom) {
      return res.status(400).json({ message: 'Nom is required' });
    }

    // Check if the new name already exists in another filiere
    const existingFiliere = await Filiere.findOne({ 
      nom, 
      _id: { $ne: id } 
    });
    
    if (existingFiliere) {
      return res.status(400).json({ message: 'Filiere with this name already exists' });
    }

    const updatedFiliere = await Filiere.findByIdAndUpdate(
      id,
      { nom },
      { new: true, runValidators: true }
    );

    if (!updatedFiliere) {
      return res.status(404).json({ message: 'Filiere not found' });
    }

    res.status(200).json({
      message: 'Filiere modifiée avec succès',
      filiere: updatedFiliere
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error updating filiere',
      error: error.message 
    });
  }
};

// Delete a filiere
exports.deleteFiliere = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedFiliere = await Filiere.findByIdAndDelete(id);

    if (!deletedFiliere) {
      return res.status(404).json({ message: 'Filiere not found' });
    }

    res.status(200).json({
      message: 'Filiere supprimée avec succès',
      filiere: deletedFiliere
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error deleting filiere',
      error: error.message 
    });
  }
};

// Get a single filiere by ID
exports.getFiliereById = async (req, res) => {
  try {
    const { id } = req.params;
    const filiere = await Filiere.findById(id);

    if (!filiere) {
      return res.status(404).json({ message: 'Filiere not found' });
    }

    res.status(200).json(filiere);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching filiere',
      error: error.message 
    });
  }
};
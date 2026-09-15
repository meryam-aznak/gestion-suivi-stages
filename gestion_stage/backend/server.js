const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const { notificationRouter, sendNotificationToClient } = require('./routes/Notification');

require('dotenv').config();
require('./scheduler'); // 👈 load your cron job here

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));




// Routes
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/stage', require('./routes/stage'));
app.use('/api/etudiants', require('./routes/etudiants'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/encadrantUniversitaire', require('./routes/encadrantUniversitaire'));
app.use('/api/encadrantProfessionnel', require('./routes/encadrantProfessionnel'));
app.use('/api/conventions', require('./routes/conventionRoutes'));
app.use('/api/filieres', require('./routes/filliere'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);

app.use('/api/notifications', notificationRouter);

app.use('/signatures', express.static(path.join(__dirname, 'uploads/signatures')));
app.use('/api/presidents', require('./routes/president'));
app.use('/api/rapport', require('./routes/rapportStage'));
app.use('/api/evaluations', require('./routes/evaluation'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});
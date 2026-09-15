const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

let clients = [];

router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

router.post('/mark-all-read', async (req, res) => {
  try {
    const { userId } = req.body;
    await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error marking notifications as read' });
  }
});

router.get('/stream', (req, res) => {
  const { userId } = req.query;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const clientId = Date.now();
  const newClient = { id: clientId, userId, res };
  clients.push(newClient);

  req.on('close', () => {
    clients = clients.filter(client => client.id !== clientId);
  });
});

// Export function separately
function sendNotificationToClient(userId, notification) {
  clients.forEach(client => {
    if (client.userId === userId) {
      client.res.write(`data: ${JSON.stringify(notification)}\n\n`);
    }
  });
}

module.exports = {
  notificationRouter: router,
  sendNotificationToClient
};

const Notification = require('../models/Notification');

const clients = {}; // Garde les connexions SSE par utilisateur

// ➤ Stream SSE : pour envoyer des notifications en temps réel
exports.streamNotifications = (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).send('userId manquant');

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();

  clients[userId] = res;

  req.on('close', () => {
    delete clients[userId];
  });
};

// ➤ Envoyer une notification à un utilisateur connecté via SSE
exports.sendNotificationToClient = (userId, notification) => {
  const client = clients[userId];
  if (client) {
    client.write(`data: ${JSON.stringify(notification)}\n\n`);
  }
};

// ➤ Récupérer les notifications
exports.getNotifications = async (req, res) => {
  const { userId } = req.query;
  try {
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des notifications' });
  }
};

// ➤ Marquer toutes les notifications comme lues
exports.markAllAsRead = async (req, res) => {
  const { userId } = req.body;
  try {
    await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
    res.status(200).json({ message: 'Toutes les notifications sont maintenant lues' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour des notifications' });
  }
};

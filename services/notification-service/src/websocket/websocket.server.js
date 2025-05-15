const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { verifyToken } = require('../config/jwt');

let wss = null;
const connectedClients = new Map();

// Initialiser le serveur WebSocket
const init = (server) => {
  // Créer un serveur WebSocket
  wss = new WebSocket.Server({ server, path: '/api/ws' });
  
  // Événement de connexion
  wss.on('connection', async (ws, req) => {
    try {
      // Extraire le token de l'URL
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      
      if (!token) {
        ws.close(1008, 'Token manquant');
        return;
      }
      
      // Vérifier le token
      let userId;
      try {
        const decoded = verifyToken(token);
        userId = decoded.id;
      } catch (error) {
        ws.close(1008, 'Token invalide');
        return;
      }
      
      // Enregistrer le client
      connectedClients.set(userId, ws);
      logger.info(`Client connecté: ${userId}`);
      
      // Envoyer un message de bienvenue
      ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connecté au serveur de notifications',
        timestamp: new Date().toISOString()
      }));
      
      // Événement de message
      ws.on('message', (message) => {
        try {
          const parsedMessage = JSON.parse(message);
          
          if (parsedMessage.type === 'ping') {
            ws.send(JSON.stringify({
              type: 'pong',
              timestamp: new Date().toISOString()
            }));
          }
        } catch (error) {
          logger.error(`Erreur lors du traitement du message: ${error.message}`);
        }
      });
      
      // Événement de fermeture
      ws.on('close', () => {
        connectedClients.delete(userId);
        logger.info(`Client déconnecté: ${userId}`);
      });
      
      // Événement d'erreur
      ws.on('error', (error) => {
        logger.error(`Erreur WebSocket: ${error.message}`);
        connectedClients.delete(userId);
      });
    } catch (error) {
      logger.error(`Erreur lors de la gestion de la connexion WebSocket: ${error.message}`);
      ws.close(1011, 'Erreur interne du serveur');
    }
  });
  
  logger.info('Serveur WebSocket initialisé');
};

// Envoyer une notification à un utilisateur spécifique
const sendNotificationToUser = (userId, notification) => {
  try {
    const client = connectedClients.get(userId);
    
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'notification',
        notification,
        timestamp: new Date().toISOString()
      }));
      
      logger.info(`Notification envoyée à l'utilisateur ${userId}`);
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error(`Erreur lors de l'envoi de la notification: ${error.message}`);
    return false;
  }
};

module.exports = {
  init,
  sendNotificationToUser
};
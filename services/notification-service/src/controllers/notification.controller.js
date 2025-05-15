const Notification = require('../models/notification.model');
const redisClient = require('../config/redis');
const websocketServer = require('../websocket/websocket.server');
const pushService = require('../services/push.service');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Créer une notification
const createNotification = async (req, res) => {
  try {
    const { user_id, type, title, message, data = {} } = req.body;
    
    // Valider les données
    if (!user_id || !type || !title || !message) {
      return res.status(400).json({ message: 'Données incomplètes. user_id, type, title et message sont requis' });
    }
    
    // Créer la notification
    const notification = new Notification({
      user_id,
      type,
      title,
      message,
      data,
      is_read: false,
      created_at: new Date()
    });
    
    await notification.save();
    
    // Envoyer la notification via WebSocket si l'utilisateur est connecté
    websocketServer.sendNotificationToUser(user_id, {
      id: notification._id,
      type,
      title,
      message,
      data,
      created_at: notification.created_at
    });
    
    // Envoyer une notification push si nécessaire
    if (type !== 'welcome') { // Exclure certains types si besoin
      try {
        await pushService.sendPushNotification(user_id, title, message, {
          notificationId: notification._id.toString(),
          type,
          ...data
        });
      } catch (pushError) {
        logger.error(`Erreur lors de l'envoi de la notification push: ${pushError.message}`);
        // Continuer malgré l'erreur
      }
    }
    
    // Incrémenter le compteur de notifications non lues pour cet utilisateur
    const unreadKey = `user:${user_id}:unread_notifications`;
    await redisClient.incr(unreadKey);
    
    return res.status(201).json({
      message: 'Notification créée avec succès',
      notification: {
        id: notification._id,
        user_id: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        created_at: notification.created_at
      }
    });
  } catch (error) {
    logger.error(`Erreur lors de la création de la notification: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la création de la notification' });
  }
};

// Créer plusieurs notifications (batch)
const createBatchNotifications = async (req, res) => {
  try {
    const { notifications } = req.body;
    
    if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
      return res.status(400).json({ message: 'Tableau de notifications requis' });
    }
    
    // Valider les données de chaque notification
    const validNotifications = notifications.filter(notif => 
      notif.user_id && notif.type && notif.title && notif.message
    );
    
    if (validNotifications.length === 0) {
      return res.status(400).json({ message: 'Aucune notification valide. user_id, type, title et message sont requis pour chaque notification' });
    }
    
    // Préparer les notifications pour l'insertion
    const notificationsToInsert = validNotifications.map(notif => ({
      user_id: notif.user_id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      data: notif.data || {},
      is_read: false,
      created_at: new Date()
    }));
    
    // Insérer les notifications
    const insertedNotifications = await Notification.insertMany(notificationsToInsert);
    
    // Envoyer les notifications via WebSocket et push
    for (const notification of insertedNotifications) {
      // WebSocket
      websocketServer.sendNotificationToUser(notification.user_id, {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        created_at: notification.created_at
      });
      
      // Push
      if (notification.type !== 'welcome') { // Exclure certains types si besoin
        try {
          await pushService.sendPushNotification(
            notification.user_id,
            notification.title,
            notification.message,
            {
              notificationId: notification._id.toString(),
              type: notification.type,
              ...notification.data
            }
          );
        } catch (pushError) {
          logger.error(`Erreur lors de l'envoi de la notification push: ${pushError.message}`);
          // Continuer malgré l'erreur
        }
      }
      
      // Incrémenter le compteur de notifications non lues
      const unreadKey = `user:${notification.user_id}:unread_notifications`;
      await redisClient.incr(unreadKey);
    }
    
    return res.status(201).json({
      message: 'Notifications créées avec succès',
      count: insertedNotifications.length
    });
  } catch (error) {
    logger.error(`Erreur lors de la création des notifications: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la création des notifications' });
  }
};

// Obtenir les notifications d'un utilisateur
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, type } = req.query;
    
    // Construire la requête
    const query = { user_id: userId };
    
    // Filtrer par type si spécifié
    if (type) {
      query.type = type;
    }
    
    // Récupérer les notifications
    const notifications = await Notification.find(query)
      .sort({ created_at: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));
    
    // Compter le nombre total de notifications
    const total = await Notification.countDocuments(query);
    
    // Compter le nombre de notifications non lues
    const unreadCount = await Notification.countDocuments({ user_id: userId, is_read: false });
    
    return res.status(200).json({
      notifications,
      meta: {
        total,
        unread: unreadCount,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logger.error(`Erreur lors de la récupération des notifications: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la récupération des notifications' });
  }
};

// Obtenir les notifications non lues d'un utilisateur
const getUnreadNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;
    
    // Récupérer les notifications non lues
    const notifications = await Notification.find({ user_id: userId, is_read: false })
      .sort({ created_at: -1 })
      .limit(parseInt(limit));
    
    // Compter le nombre total de notifications non lues
    const total = await Notification.countDocuments({ user_id: userId, is_read: false });
    
    return res.status(200).json({
      notifications,
      meta: {
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error(`Erreur lors de la récupération des notifications non lues: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la récupération des notifications non lues' });
  }
};

// Marquer une notification comme lue
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    
    // Vérifier si l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ message: 'ID de notification invalide' });
    }
    
    // Récupérer la notification
    const notification = await Notification.findById(notificationId);
    
   if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }
    
    // Vérifier si l'utilisateur est le destinataire de la notification
    if (notification.user_id !== userId) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à accéder à cette notification' });
    }
    
    // Vérifier si la notification est déjà lue
    if (notification.is_read) {
      return res.status(200).json({
        message: 'Notification déjà marquée comme lue',
        notification
      });
    }
    
    // Marquer la notification comme lue
    notification.is_read = true;
    notification.read_at = new Date();
    
    await notification.save();
    
    // Décrémenter le compteur de notifications non lues pour cet utilisateur
    const unreadKey = `user:${userId}:unread_notifications`;
    const unreadCount = await redisClient.get(unreadKey);
    
    if (unreadCount && parseInt(unreadCount) > 0) {
      await redisClient.decr(unreadKey);
    }
    
    return res.status(200).json({
      message: 'Notification marquée comme lue',
      notification
    });
  } catch (error) {
    logger.error(`Erreur lors du marquage de la notification comme lue: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors du marquage de la notification comme lue' });
  }
};

// Marquer toutes les notifications comme lues
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;
    
    // Construire la requête
    const query = { user_id: userId, is_read: false };
    
    // Filtrer par type si spécifié
    if (type) {
      query.type = type;
    }
    
    // Mettre à jour les notifications
    const result = await Notification.updateMany(query, {
      $set: {
        is_read: true,
        read_at: new Date()
      }
    });
    
    // Réinitialiser le compteur de notifications non lues pour cet utilisateur
    const unreadKey = `user:${userId}:unread_notifications`;
    
    if (type) {
      // Si un type est spécifié, recalculer le compteur
      const unreadCount = await Notification.countDocuments({ user_id: userId, is_read: false });
      await redisClient.set(unreadKey, unreadCount.toString());
    } else {
      // Sinon, réinitialiser à 0
      await redisClient.set(unreadKey, '0');
    }
    
    return res.status(200).json({
      message: 'Notifications marquées comme lues',
      count: result.modifiedCount
    });
  } catch (error) {
    logger.error(`Erreur lors du marquage de toutes les notifications comme lues: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors du marquage de toutes les notifications comme lues' });
  }
};

// Supprimer une notification
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    
    // Vérifier si l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ message: 'ID de notification invalide' });
    }
    
    // Récupérer la notification
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }
    
    // Vérifier si l'utilisateur est le destinataire de la notification
    if (notification.user_id !== userId) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer cette notification' });
    }
    
    // Supprimer la notification
    await notification.deleteOne();
    
    // Si la notification n'était pas lue, décrémenter le compteur
    if (!notification.is_read) {
      const unreadKey = `user:${userId}:unread_notifications`;
      const unreadCount = await redisClient.get(unreadKey);
      
      if (unreadCount && parseInt(unreadCount) > 0) {
        await redisClient.decr(unreadKey);
      }
    }
    
    return res.status(200).json({
      message: 'Notification supprimée avec succès'
    });
  } catch (error) {
    logger.error(`Erreur lors de la suppression de la notification: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la suppression de la notification' });
  }
};

module.exports = {
  createNotification,
  createBatchNotifications,
  getUserNotifications,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
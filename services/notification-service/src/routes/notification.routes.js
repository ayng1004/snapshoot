const express = require('express');
const notificationController = require('../controllers/notification.controller');
const { authMiddleware, serviceAuthMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// Routes pour les utilisateurs authentifiés
router.get('/', authMiddleware, notificationController.getUserNotifications);
router.get('/unread', authMiddleware, notificationController.getUnreadNotifications);
router.put('/:notificationId/read', authMiddleware, notificationController.markAsRead);
router.put('/read-all', authMiddleware, notificationController.markAllAsRead);
router.delete('/:notificationId', authMiddleware, notificationController.deleteNotification);

// Routes pour les communications entre services
router.post('/', serviceAuthMiddleware, notificationController.createNotification);
router.post('/batch', serviceAuthMiddleware, notificationController.createBatchNotifications);

module.exports = router;
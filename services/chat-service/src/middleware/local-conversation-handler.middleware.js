// middleware/local-conversation-handler.middleware.js
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const db = require('../config/database');

const isValidUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

// Middleware pour gérer les conversations créées localement
const localConversationHandler = async (req, res, next) => {
  try {
    // Ignorer les requêtes non liées aux conversations
    if (!req.path.includes('/conversations/')) {
      return next();
    }
    
    // Extraire l'ID de conversation de la requête
    const conversationId = req.params.conversationId || 
                           (req.path.match(/\/conversations\/([^\/]+)/) || [])[1];
    
    if (!conversationId || !isValidUUID(conversationId)) {
      return next();
    }
    
    logger.info(`Vérification de l'existence de la conversation: ${conversationId}`);
    
    // Vérifier si la conversation existe déjà
    const existingConversation = await db.query(
      'SELECT id FROM conversations WHERE id = $1',
      [conversationId]
    );
    
    if (existingConversation.rows.length > 0) {
      // La conversation existe, continuer normalement
      return next();
    }
    
    logger.info(`Conversation ${conversationId} non trouvée, tentative de création...`);
    
    // La conversation n'existe pas, nous allons la créer
    const now = new Date();
    const userId = req.user?.id;
    
    if (!userId) {
      // User non authentifié, impossible de créer la conversation
      return next();
    }
    
    // Créer la conversation et ajouter l'utilisateur courant comme participant
    await db.transaction(async (client) => {
      // Créer la conversation
      await client.query(
        `INSERT INTO conversations (id, is_group, name, created_by, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [conversationId, false, null, userId, now, now]
      );
      
      // Ajouter l'utilisateur courant comme participant
      await client.query(
        `INSERT INTO conversation_participants (conversation_id, user_id, joined_at) 
         VALUES ($1, $2, $3)`,
        [conversationId, userId, now]
      );
      
      logger.info(`Conversation locale ${conversationId} créée avec succès pour l'utilisateur ${userId}`);
    });
    
    // Continuer avec la requête
    next();
  } catch (error) {
    logger.error(`Erreur dans le middleware de traitement des conversations locales: ${error.message}`);
    next();
  }
};

module.exports = localConversationHandler;
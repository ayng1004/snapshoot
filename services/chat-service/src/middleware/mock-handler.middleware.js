/**
 * Middleware pour gérer les conversations créées localement par le client mobile
 * Crée la conversation dans la base de données si elle n'existe pas
 */
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const logger = require('../utils/logger');

const mockHandlerMiddleware = async (req, res, next) => {
  // Ne s'applique qu'aux routes de messages pour une conversation spécifique
  if (!req.url.includes('/messages')) {
    return next();
  }
  
  try {
    // Extraction de l'ID de conversation (depuis les paramètres de route ou la requête)
    const conversationId = req.params.conversationId || req.query.conversation_id;
    
    if (!conversationId) {
      return next();
    }
    
    logger.info(`Vérification de l'existence de la conversation: ${conversationId}`);
    
    // Vérifier si la conversation existe
    const conversationResult = await db.query(
      'SELECT * FROM conversations WHERE id = $1',
      [conversationId]
    );
    
    if (conversationResult.rows.length > 0) {
      // La conversation existe, poursuivre normalement
      return next();
    }
    
    // La conversation n'existe pas, c'est probablement une conversation créée localement
    logger.info(`Conversation ${conversationId} non trouvée, tentative de création...`);
    
    // Essayer de récupérer les participants depuis le cache du client (si disponible)
    let participants = [];
    if (req.body && req.body.participants) {
      participants = req.body.participants;
    } else {
      // Par défaut, inclure l'utilisateur actuel uniquement
      participants = [req.user.id];
    }
    
    // Créer la conversation dans la base de données
    const now = new Date();
    await db.transaction(async (client) => {
      // Créer la conversation
      await client.query(
        `INSERT INTO conversations 
         (id, is_group, name, avatar, created_by, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [conversationId, false, null, null, req.user.id, now, now]
      );
      
      // Ajouter l'utilisateur courant comme participant
      await client.query(
        `INSERT INTO conversation_participants 
         (conversation_id, user_id, joined_at, is_active, unread_count) 
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (conversation_id, user_id) DO NOTHING`,
        [conversationId, req.user.id, now, true, 0]
      );
      
      // Ajouter les autres participants (si fournis)
      for (const participantId of participants) {
        if (participantId !== req.user.id) {
          await client.query(
            `INSERT INTO conversation_participants 
             (conversation_id, user_id, joined_at, is_active, unread_count) 
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (conversation_id, user_id) DO NOTHING`,
            [conversationId, participantId, now, true, 0]
          );
        }
      }
    });
    
    logger.info(`Conversation ${conversationId} créée avec succès pour l'utilisateur ${req.user.id}`);
    next();
  } catch (error) {
    logger.error(`Erreur dans le middleware de traitement des conversations locales: ${error.message}`);
    // Ne pas bloquer la requête, continuer normalement
    next();
  }
};

module.exports = mockHandlerMiddleware;
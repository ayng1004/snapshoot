// services/chat-service/src/models/conversation.model.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Conversation extends Model {
  // Méthode pour ajouter un participant
  async addParticipant(userId) {
    try {
      // Vérifier si le participant existe déjà
      const existingParticipant = await sequelize.models.ConversationParticipant.findOne({
        where: {
          conversation_id: this.id,
          user_id: userId
        }
      });

      if (!existingParticipant) {
        // Créer un nouveau participant
        await sequelize.models.ConversationParticipant.create({
          conversation_id: this.id,
          user_id: userId,
          is_admin: false,
          unread_count: 0
        });
      } else if (existingParticipant.left_at) {
        // Réactiver un participant qui avait quitté
        existingParticipant.left_at = null;
        await existingParticipant.save();
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'ajout d\'un participant:', error);
      return false;
    }
  }

  // Méthode pour supprimer un participant
  async removeParticipant(userId) {
    try {
      const participant = await sequelize.models.ConversationParticipant.findOne({
        where: {
          conversation_id: this.id,
          user_id: userId,
          left_at: null
        }
      });

      if (participant) {
        participant.left_at = new Date();
        await participant.save();
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression d\'un participant:', error);
      return false;
    }
  }

  // Méthode pour obtenir tous les participants actifs
  async getActiveParticipants() {
    try {
      const participants = await sequelize.models.ConversationParticipant.findAll({
        where: {
          conversation_id: this.id,
          left_at: null
        },
        attributes: ['user_id', 'is_admin', 'unread_count', 'joined_at']
      });
      
      return participants.map(p => p.user_id);
    } catch (error) {
      console.error('Erreur lors de la récupération des participants:', error);
      return [];
    }
  }

  // Méthode pour réinitialiser le compteur de messages non lus
  async resetUnreadCount(userId) {
    try {
      await sequelize.models.ConversationParticipant.update(
        { unread_count: 0 },
        {
          where: {
            conversation_id: this.id,
            user_id: userId,
            left_at: null
          }
        }
      );
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du compteur:', error);
      return false;
    }
  }

  // Méthode pour obtenir le compteur de messages non lus d'un utilisateur
  async getUnreadCount(userId) {
    try {
      const participant = await sequelize.models.ConversationParticipant.findOne({
        where: {
          conversation_id: this.id,
          user_id: userId,
          left_at: null
        }
      });
      
      return participant ? participant.unread_count : 0;
    } catch (error) {
      console.error('Erreur lors de la récupération du compteur:', error);
      return 0;
    }
  }
}

Conversation.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  is_group: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'Conversation',
  tableName: 'conversations',
  timestamps: false
});

module.exports = Conversation;
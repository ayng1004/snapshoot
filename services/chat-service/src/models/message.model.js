// services/chat-service/src/models/message.model.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Message extends Model {
  // Méthode pour marquer un message comme supprimé
  async deleteMessage() {
    this.is_deleted = true;
    this.content = null;
    this.media_url = null;
    this.media_type = null;
    await this.save();
  }

  // Méthode pour marquer un message comme lu par un utilisateur
  async markAsRead(userId) {
    try {
      // Vérifier si le message a déjà été lu par cet utilisateur
      const existingRead = await sequelize.models.MessageRead.findOne({
        where: {
          message_id: this.id,
          user_id: userId
        }
      });

      if (!existingRead) {
        // Créer une nouvelle entrée dans la table des lectures
        await sequelize.models.MessageRead.create({
          message_id: this.id,
          user_id: userId,
          read_at: new Date()
        });
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors du marquage du message comme lu:', error);
      return false;
    }
  }

  // Méthode pour vérifier si un message a été lu par un utilisateur
  async isReadBy(userId) {
    try {
      const read = await sequelize.models.MessageRead.findOne({
        where: {
          message_id: this.id,
          user_id: userId
        }
      });
      
      return !!read;
    } catch (error) {
      console.error('Erreur lors de la vérification de lecture:', error);
      return false;
    }
  }

  // Obtenir tous les utilisateurs qui ont lu ce message
  async getReadBy() {
    try {
      const reads = await sequelize.models.MessageRead.findAll({
        where: {
          message_id: this.id
        },
        attributes: ['user_id', 'read_at']
      });
      
      return reads.map(read => ({
        user_id: read.user_id,
        read_at: read.read_at
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des lectures:', error);
      return [];
    }
  }
}

Message.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  conversation_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'conversations',
      key: 'id'
    }
  },
  sender_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  media_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  media_type: {
    type: DataTypes.STRING,
    allowNull: true
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
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
  modelName: 'Message',
  tableName: 'messages',
  timestamps: false
});

module.exports = Message;
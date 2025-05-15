// services/chat-service/src/models/conversation_participant.model.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class ConversationParticipant extends Model {}

ConversationParticipant.init({
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
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  joined_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  left_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_admin: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  unread_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  sequelize,
  modelName: 'ConversationParticipant',
  tableName: 'conversation_participants',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['conversation_id', 'user_id']
    }
  ]
});

module.exports = ConversationParticipant;
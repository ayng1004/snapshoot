// services/chat-service/src/models/message_read.model.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class MessageRead extends Model {}

MessageRead.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  message_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'messages',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'MessageRead',
  tableName: 'message_reads',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['message_id', 'user_id']
    }
  ]
});

module.exports = MessageRead;
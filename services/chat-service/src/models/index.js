// src/models/index.js
const Conversation = require('./conversation.model');
const ConversationParticipant = require('./conversation_participant.model');
const Message = require('./message.model');
const MessageRead = require('./message_read.model');

// Définir les associations
Conversation.hasMany(ConversationParticipant, { foreignKey: 'conversation_id', as: 'participants' });
ConversationParticipant.belongsTo(Conversation, { foreignKey: 'conversation_id' });

Conversation.hasMany(Message, { foreignKey: 'conversation_id', as: 'messages' });
Message.belongsTo(Conversation, { foreignKey: 'conversation_id' });

Message.hasMany(MessageRead, { foreignKey: 'message_id', as: 'reads' });
MessageRead.belongsTo(Message, { foreignKey: 'message_id' });

module.exports = {
  Conversation,
  ConversationParticipant,
  Message,
  MessageRead
};
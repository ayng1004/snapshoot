const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  user_id: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'welcome',
      'friend_request',
      'friend_request_accepted',
      'new_message',
      'group_created',
      'group_invite',
      'new_story',
      'story_viewed',
      'system'
    ]
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: Object,
    default: {}
  },
  is_read: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  read_at: {
    type: Date,
    default: null
  }
});

// Indexation pour les requêtes fréquentes
notificationSchema.index({ user_id: 1, created_at: -1 });
notificationSchema.index({ user_id: 1, is_read: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
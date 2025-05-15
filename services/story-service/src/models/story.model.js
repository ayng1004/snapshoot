const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const expirationUtils = require('../utils/expiration.utils');

const storySchema = new Schema({
  user_id: {
    type: String,
    required: true,
    index: true
  },
  media_url: {
    type: String,
    required: true
  },
  thumbnail_url: {
    type: String,
    default: null
  },
  media_type: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  caption: {
    type: String,
    default: ''
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: null
    }
  },
  is_public: {
    type: Boolean,
    default: true
  },
  viewers: [{
    user_id: String,
    viewed_at: Date
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  expires_at: {
    type: Date,
    default: () => expirationUtils.calculateExpirationDate(),
    index: true
  }
});

// Indexation géospatiale
storySchema.index({ location: '2dsphere' });
storySchema.index({ user_id: 1, created_at: -1 });
storySchema.index({ expires_at: 1 });
storySchema.index({ "viewers.user_id": 1 });

// Méthode de recherche de stories à proximité
storySchema.statics.findNearby = function(longitude, latitude, radiusInMeters = 10000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: radiusInMeters
      }
    },
    expires_at: { $gt: new Date() },
    is_public: true
  });
};

// Méthode pour marquer une story comme vue
storySchema.methods.markAsViewed = function(userId) {
  const alreadyViewed = this.viewers.some(viewer => viewer.user_id === userId);
  
  if (!alreadyViewed) {
    this.viewers.push({
      user_id: userId,
      viewed_at: new Date()
    });
  }
  
  return this.save();
};

// Méthode virtuelle pour vérifier si la story est expirée
storySchema.virtual('isExpired').get(function() {
  return expirationUtils.isExpired(this.expires_at);
});

const Story = mongoose.model('Story', storySchema);

module.exports = Story;
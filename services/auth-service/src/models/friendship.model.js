const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./user.model');

const Friendship = sequelize.define('friendship', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  requester_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  addressee_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'blocked'),
    defaultValue: 'pending'
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['requester_id', 'addressee_id']
    }
  ]
});

// Relations avec User
User.hasMany(Friendship, { foreignKey: 'requester_id', as: 'friendRequestsSent' });
User.hasMany(Friendship, { foreignKey: 'addressee_id', as: 'friendRequestsReceived' });

Friendship.belongsTo(User, { foreignKey: 'requester_id', as: 'requester' });
Friendship.belongsTo(User, { foreignKey: 'addressee_id', as: 'addressee' });

module.exports = Friendship;
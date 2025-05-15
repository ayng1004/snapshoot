const { DataTypes } = require('sequelize');
const { sequelize, createGeometry } = require('../config/database');

const Location = sequelize.define('location', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: false,
    index: true
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  accuracy: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  location_type: {
    type: DataTypes.ENUM('user', 'story'),
    defaultValue: 'user'
  },
  reference_id: {
    type: DataTypes.STRING,
    allowNull: true,
    index: true
  },
  geom: createGeometry('POINT'),
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: (location) => {
      // Créer automatiquement le point géographique à partir des coordonnées
      if (location.latitude && location.longitude) {
        location.geom = { 
          type: 'Point', 
          coordinates: [location.longitude, location.latitude],
          crs: { type: 'name', properties: { name: 'EPSG:4326' } }
        };
      }
    },
    beforeUpdate: (location) => {
      // Mettre à jour le point géographique si les coordonnées changent
      if (location.changed('latitude') || location.changed('longitude')) {
        location.geom = { 
          type: 'Point', 
          coordinates: [location.longitude, location.latitude],
          crs: { type: 'name', properties: { name: 'EPSG:4326' } }
        };
      }
    }
  }
});

// Ajouter des méthodes pour les recherches spatiales
Location.findNearby = function(latitude, longitude, radius = 5000, limit = 30) {
  const point = {
    type: 'Point',
    coordinates: [longitude, latitude]
  };

  return this.findAll({
    where: sequelize.where(
      sequelize.fn('ST_DWithin',
        sequelize.col('geom'),
        sequelize.fn('ST_SetSRID', 
          sequelize.fn('ST_GeomFromGeoJSON', JSON.stringify(point)),
          4326
        ),
        radius
      ),
      true
    ),
    order: [
      [sequelize.fn('ST_Distance', 
        sequelize.col('geom'),
        sequelize.fn('ST_SetSRID', 
          sequelize.fn('ST_GeomFromGeoJSON', JSON.stringify(point)),
          4326
        )
      ), 'ASC']
    ],
    limit
  });
};

module.exports = Location;
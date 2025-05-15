// services/geo-service/src/config/database.js
const { Sequelize, DataTypes } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'geo_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'geo-db',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: msg => logger.debug(msg),
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Fonction pour créer un type de géométrie PostGIS
const createGeometry = (type) => {
  return DataTypes.GEOMETRY(type, 4326);
};

module.exports = { 
  sequelize,
  createGeometry
};
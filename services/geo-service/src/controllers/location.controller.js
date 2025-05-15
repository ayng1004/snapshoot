const Location = require('../models/location.model');
const redisClient = require('../config/redis');
const geoUtils = require('../utils/geo.utils');
const storyService = require('../services/story.service');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// Mettre à jour la position de l'utilisateur
const updateUserLocation = async (req, res) => {
  try {
    const { latitude, longitude, accuracy } = req.body;
    
    // Valider les coordonnées
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude) || 
        latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ message: 'Coordonnées de géolocalisation invalides' });
    }
    
    // Rechercher une entrée existante pour cet utilisateur
    const existingLocation = await Location.findOne({
      where: {
        user_id: req.user.id,
        location_type: 'user'
      }
    });
    
    if (existingLocation) {
      // Mettre à jour l'entrée existante
      await existingLocation.update({
        latitude,
        longitude,
        accuracy: accuracy || null,
        created_at: new Date()
      });
    } else {
      // Créer une nouvelle entrée
      await Location.create({
        user_id: req.user.id,
        latitude,
        longitude,
        accuracy: accuracy || null,
        location_type: 'user'
      });
    }
    
    // Mettre à jour la position dans Redis pour une recherche rapide
    const redisKey = `user:location:${req.user.id}`;
    await redisClient.hSet(redisKey, {
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      updated_at: Date.now().toString()
    });
    
    // Définir une expiration (24 heures)
    await redisClient.expire(redisKey, 24 * 60 * 60);
    
    return res.status(200).json({
      message: 'Position mise à jour avec succès',
      location: {
        latitude,
        longitude,
        accuracy: accuracy || null,
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour de la position: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour de la position' });
  }
};

// Obtenir les utilisateurs à proximité
const getNearbyUsers = async (req, res) => {
  try {
    // Paramètres
    const { radius = 5000 } = req.query; // Rayon par défaut: 5km
    const maxRadius = 50000; // Maximum 50km
    
    // Limiter le rayon
    const searchRadius = Math.min(parseInt(radius), maxRadius);
    
    // Obtenir la position de l'utilisateur courant
    const redisKey = `user:location:${req.user.id}`;
    const userLocation = await redisClient.hGetAll(redisKey);
    
    if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
      return res.status(400).json({ message: 'Position de l\'utilisateur non disponible. Veuillez mettre à jour votre position.' });
    }
    
    const userLat = parseFloat(userLocation.latitude);
    const userLng = parseFloat(userLocation.longitude);
    
    // Calculer les limites de la boîte englobante pour optimiser la requête
    const bounds = geoUtils.calculateBoundingBox(userLat, userLng, searchRadius);
    
    // Rechercher les utilisateurs dans la base de données
    const nearbyLocations = await Location.findAll({
      where: {
        location_type: 'user',
        user_id: {
          [Op.ne]: req.user.id // Exclure l'utilisateur courant
        },
        latitude: {
          [Op.between]: [bounds.minLat, bounds.maxLat]
        },
        longitude: {
          [Op.between]: [bounds.minLng, bounds.maxLng]
        },
        created_at: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Uniquement les positions des dernières 24h
        }
      },
      attributes: ['user_id', 'latitude', 'longitude', 'created_at']
    });
    
    // Filtrer les résultats pour ne garder que ceux qui sont réellement dans le rayon
    const nearbyUsers = nearbyLocations
      .filter(location => {
        const distance = geoUtils.calculateDistance(
          userLat, userLng,
          location.latitude, location.longitude
        );
        return distance <= searchRadius;
      })
      .map(location => {
        const distance = geoUtils.calculateDistance(
          userLat, userLng,
          location.latitude, location.longitude
        );
        return {
          user_id: location.user_id,
          distance: Math.round(distance), // Arrondir la distance en mètres
          coordinates: {
            latitude: location.latitude,
            longitude: location.longitude
          },
          last_update: location.created_at
        };
      })
      .sort((a, b) => a.distance - b.distance); // Trier par distance
    
    return res.status(200).json({
      users: nearbyUsers,
      count: nearbyUsers.length,
      search_radius: searchRadius
    });
  } catch (error) {
    logger.error(`Erreur lors de la recherche d'utilisateurs à proximité: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la recherche d\'utilisateurs à proximité' });
  }
};

// Obtenir les stories à proximité
const getNearbyStories = async (req, res) => {
  try {
    // Paramètres
    const { radius = 10000 } = req.query; // Rayon par défaut: 10km
    const maxRadius = 50000; // Maximum 50km
    
    // Limiter le rayon
    const searchRadius = Math.min(parseInt(radius), maxRadius);
    
    // Obtenir la position de l'utilisateur courant
    const redisKey = `user:location:${req.user.id}`;
    const userLocation = await redisClient.hGetAll(redisKey);
    
    // Si l'utilisateur n'a pas de position enregistrée, utiliser les coordonnées fournies dans la requête
    let userLat, userLng;
    
    if (userLocation && userLocation.latitude && userLocation.longitude) {
      userLat = parseFloat(userLocation.latitude);
      userLng = parseFloat(userLocation.longitude);
    } else if (req.query.latitude && req.query.longitude) {
      userLat = parseFloat(req.query.latitude);
      userLng = parseFloat(req.query.longitude);
    } else {
      return res.status(400).json({ message: 'Position non disponible. Veuillez fournir des coordonnées ou mettre à jour votre position.' });
    }
    
    // Calculer les limites de la boîte englobante pour optimiser la requête
    const bounds = geoUtils.calculateBoundingBox(userLat, userLng, searchRadius);
    
    // Rechercher les stories avec localisation dans la base de données
    const storyLocations = await Location.findAll({
      where: {
        location_type: 'story',
        latitude: {
          [Op.between]: [bounds.minLat, bounds.maxLat]
        },
        longitude: {
          [Op.between]: [bounds.minLng, bounds.maxLng]
        },
        expires_at: {
          [Op.gt]: new Date() // Uniquement les stories non expirées
        }
      },
      attributes: ['reference_id', 'latitude', 'longitude', 'created_at', 'expires_at']
    });
    
    // Filtrer les résultats pour ne garder que ceux qui sont réellement dans le rayon
    const nearbyStoryLocations = storyLocations
      .filter(location => {
        const distance = geoUtils.calculateDistance(
          userLat, userLng,
          location.latitude, location.longitude
        );
        return distance <= searchRadius;
      })
      .map(location => {
        const distance = geoUtils.calculateDistance(
          userLat, userLng,
          location.latitude, location.longitude
        );
        return {
          story_id: location.reference_id,
          distance: Math.round(distance), // Arrondir la distance en mètres
          coordinates: {
            latitude: location.latitude,
            longitude: location.longitude
          },
          created_at: location.created_at,
          expires_at: location.expires_at
        };
      })
      .sort((a, b) => a.distance - b.distance); // Trier par distance
    
    // Obtenir les détails des stories depuis le service de stories
    const storyIds = nearbyStoryLocations.map(story => story.story_id);
    
    if (storyIds.length === 0) {
      return res.status(200).json({
        stories: [],
        count: 0,
        search_radius: searchRadius
      });
    }
    
    const storiesDetails = await storyService.getStoriesDetails(storyIds);
    
    // Fusionner les données de localisation avec les détails des stories
    const nearbyStories = nearbyStoryLocations.map(storyLocation => {
      const storyDetails = storiesDetails.find(story => story.id === storyLocation.story_id) || {};
      
      return {
        ...storyLocation,
        ...storyDetails
      };
    });
    
    return res.status(200).json({
      stories: nearbyStories,
      count: nearbyStories.length,
      search_radius: searchRadius
    });
  } catch (error) {
    logger.error(`Erreur lors de la recherche de stories à proximité: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la recherche de stories à proximité' });
  }
};

module.exports = {
  updateUserLocation,
  getNearbyUsers,
  getNearbyStories
};
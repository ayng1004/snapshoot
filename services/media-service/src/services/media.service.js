const path = require('path');
const fs = require('fs');
const minioClient = require('../config/minio');
const fileTypeUtils = require('../utils/file-type.utils');
const logger = require('../utils/logger');

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'minio';
const MINIO_PORT = process.env.MINIO_PORT || '9000';
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true';

// Construire l'URL publique d'un objet MinIO
const buildPublicUrl = (bucket, objectName) => {
  const protocol = MINIO_USE_SSL ? 'https' : 'http';
  return `${protocol}://${MINIO_ENDPOINT}:${MINIO_PORT}/${bucket}/${objectName}`;
};

// Générer une URL signée (pour accès temporaire)
const generatePresignedUrl = async (bucket, objectName, expiry = 60 * 60) => {
  try {
    const url = await minioClient.presignedGetObject(bucket, objectName, expiry);
    return url;
  } catch (error) {
    logger.error(`Erreur lors de la génération de l'URL signée: ${error.message}`);
    return null;
  }
};

// Upload d'une image de profil
const uploadProfileImage = async (filePath, mediaId, userId) => {
  try {
    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'Fichier non trouvé' };
    }
    
    // Générer les noms d'objets
    const objectName = `${userId}/${mediaId}`;
    const thumbnailObjectName = `${userId}/${mediaId}_thumbnail`;
    
    // Générer un chemin temporaire pour le thumbnail
    const thumbnailPath = path.join(path.dirname(filePath), `thumbnail_${path.basename(filePath)}`);
    
    // Créer un thumbnail
    await fileTypeUtils.createThumbnail(filePath, thumbnailPath);
    
    // Uploader l'image originale vers MinIO
    await minioClient.fPutObject('profile-images', objectName, filePath, {
      'Content-Type': 'image/jpeg'
    });
    
    // Uploader le thumbnail vers MinIO
    if (fs.existsSync(thumbnailPath)) {
      await minioClient.fPutObject('profile-images', thumbnailObjectName, thumbnailPath, {
        'Content-Type': 'image/jpeg'
      });
      
      // Supprimer le thumbnail temporaire
      fileTypeUtils.deleteFile(thumbnailPath);
    }
    
    // Générer les URLs
    const url = buildPublicUrl('profile-images', objectName);
    const thumbnailUrl = buildPublicUrl('profile-images', thumbnailObjectName);
    
    return {
      success: true,
      url,
      thumbnailUrl
    };
  } catch (error) {
    logger.error(`Erreur lors de l'upload de l'image de profil: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Upload d'une image pour un message
const uploadMessageImage = async (filePath, mediaId, userId, conversationId) => {
  try {
    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'Fichier non trouvé' };
    }
    
    // Générer les noms d'objets
    const objectName = `${conversationId}/${userId}/${mediaId}`;
    const thumbnailObjectName = `${conversationId}/${userId}/${mediaId}_thumbnail`;
    
    // Générer un chemin temporaire pour le thumbnail
    const thumbnailPath = path.join(path.dirname(filePath), `thumbnail_${path.basename(filePath)}`);
    
    // Créer un thumbnail
    await fileTypeUtils.createThumbnail(filePath, thumbnailPath);
    
    // Uploader l'image originale vers MinIO
    await minioClient.fPutObject('message-media', objectName, filePath, {
      'Content-Type': 'image/jpeg'
    });
    
    // Uploader le thumbnail vers MinIO
    if (fs.existsSync(thumbnailPath)) {
      await minioClient.fPutObject('message-media', thumbnailObjectName, thumbnailPath, {
        'Content-Type': 'image/jpeg'
      });
      
      // Supprimer le thumbnail temporaire
      fileTypeUtils.deleteFile(thumbnailPath);
    }
    
    // Générer les URLs
    const url = buildPublicUrl('message-media', objectName);
    const thumbnailUrl = buildPublicUrl('message-media', thumbnailObjectName);
    
    return {
      success: true,
      url,
      thumbnailUrl
    };
  } catch (error) {
    logger.error(`Erreur lors de l'upload de l'image: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Upload d'une vidéo pour un message
const uploadMessageVideo = async (filePath, mediaId, userId, conversationId) => {
  try {
    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'Fichier non trouvé' };
    }
    
    // Générer les noms d'objets
    const objectName = `${conversationId}/${userId}/${mediaId}`;
    
    // Uploader la vidéo vers MinIO
    await minioClient.fPutObject('message-media', objectName, filePath, {
      'Content-Type': 'video/mp4'
    });
    
    // Générer l'URL
    const url = buildPublicUrl('message-media', objectName);
    
    return {
      success: true,
      url,
      thumbnailUrl: null
    };
  } catch (error) {
    logger.error(`Erreur lors de l'upload de la vidéo: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Upload d'une image pour une story
const uploadStoryImage = async (filePath, mediaId, userId, location) => {
  try {
    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'Fichier non trouvé' };
    }
    
    // Générer les noms d'objets
    const objectName = `${userId}/${mediaId}`;
    const thumbnailObjectName = `${userId}/${mediaId}_thumbnail`;
    
    // Générer un chemin temporaire pour le thumbnail
    const thumbnailPath = path.join(path.dirname(filePath), `thumbnail_${path.basename(filePath)}`);
    
    // Créer un thumbnail
    await fileTypeUtils.createThumbnail(filePath, thumbnailPath);
    
    // Métadonnées pour MinIO
    const metadata = {
      'Content-Type': 'image/jpeg',
      'X-Amz-Meta-User-Id': userId
    };
    
    // Ajouter les informations de localisation si disponibles
    if (location && location.latitude && location.longitude) {
      metadata['X-Amz-Meta-Latitude'] = location.latitude.toString();
      metadata['X-Amz-Meta-Longitude'] = location.longitude.toString();
    }
    
    // Uploader l'image originale vers MinIO
    await minioClient.fPutObject('story-media', objectName, filePath, metadata);
    
    // Uploader le thumbnail vers MinIO
    if (fs.existsSync(thumbnailPath)) {
      await minioClient.fPutObject('story-media', thumbnailObjectName, thumbnailPath, {
        'Content-Type': 'image/jpeg'
      });
      
      // Supprimer le thumbnail temporaire
      fileTypeUtils.deleteFile(thumbnailPath);
    }
    
    // Générer les URLs
    const url = buildPublicUrl('story-media', objectName);
    const thumbnailUrl = buildPublicUrl('story-media', thumbnailObjectName);
    
    return {
      success: true,
      url,
      thumbnailUrl
    };
  } catch (error) {
    logger.error(`Erreur lors de l'upload de l'image pour la story: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Upload d'une vidéo pour une story
const uploadStoryVideo = async (filePath, mediaId, userId, location) => {
  try {
    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'Fichier non trouvé' };
    }
    
    // Générer les noms d'objets
    const objectName = `${userId}/${mediaId}`;
    
    // Métadonnées pour MinIO
    const metadata = {
      'Content-Type': 'video/mp4',
      'X-Amz-Meta-User-Id': userId
    };
    
    // Ajouter les informations de localisation si disponibles
    if (location && location.latitude && location.longitude) {
      metadata['X-Amz-Meta-Latitude'] = location.latitude.toString();
      metadata['X-Amz-Meta-Longitude'] = location.longitude.toString();
    }
    
    // Uploader la vidéo vers MinIO
    await minioClient.fPutObject('story-media', objectName, filePath, metadata);
    
    // Générer l'URL
    const url = buildPublicUrl('story-media', objectName);
    
    return {
      success: true,
      url,
      thumbnailUrl: null
    };
  } catch (error) {
    logger.error(`Erreur lors de l'upload de la vidéo pour la story: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Récupérer un média
const getMedia = async (mediaId, thumbnail = false) => {
  try {
    // Déterminer dans quel bucket chercher
    const buckets = ['profile-images', 'message-media', 'story-media'];
    
    for (const bucket of buckets) {
      try {
        // Rechercher le média dans le bucket
        const objStream = await minioClient.listObjects(bucket, mediaId, true);
        
        let found = false;
        for await (const obj of objStream) {
          // Vérifier si c'est le média ou son thumbnail selon la demande
          const isRequested = thumbnail 
            ? obj.name.includes('_thumbnail')
            : !obj.name.includes('_thumbnail');
          
          if (isRequested) {
            // Générer une URL signée
            const url = await generatePresignedUrl(bucket, obj.name);
            
            if (url) {
              found = true;
              return {
                success: true,
                url
              };
            }
          }
        }
        
        if (found) break;
      } catch (err) {
        // Continuer avec le bucket suivant
        continue;
      }
    }
    
    return { success: false, error: 'Média non trouvé' };
  } catch (error) {
    logger.error(`Erreur lors de la récupération du média: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Supprimer un média
const deleteMedia = async (mediaId, userId) => {
  try {
    // Déterminer dans quel bucket chercher
    const buckets = ['profile-images', 'message-media', 'story-media'];
    
    for (const bucket of buckets) {
      try {
        let objectsToRemove = [];
        
        // Rechercher le média dans le bucket
        const objStream = await minioClient.listObjects(bucket, mediaId, true);
        
        for await (const obj of objStream) {
          // Vérifier que l'objet appartient à l'utilisateur (à partir du chemin)
          const pathParts = obj.name.split('/');
          
          if (pathParts[0] === userId) {
            objectsToRemove.push(obj.name);
          }
        }
        
        if (objectsToRemove.length > 0) {
          // Supprimer les objets
          await minioClient.removeObjects(bucket, objectsToRemove);
          
          return {
            success: true
          };
        }
      } catch (err) {
        // Continuer avec le bucket suivant
        continue;
      }
    }
    
    return { success: false, error: 'Média non trouvé ou vous n\'êtes pas autorisé à le supprimer' };
  } catch (error) {
    logger.error(`Erreur lors de la suppression du média: ${error.message}`);
    return { success: false, error: error.message };
  }
};

module.exports = {
  uploadProfileImage,
  uploadMessageImage,
  uploadMessageVideo,
  uploadStoryImage,
  uploadStoryVideo,
  getMedia,
  deleteMedia
};
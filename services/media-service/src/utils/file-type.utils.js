const path = require('path');
const sharp = require('sharp');
const fs = require('fs');
const logger = require('./logger');

// Vérifier si un fichier est une image
const isImage = (filename) => {
  const extension = path.extname(filename).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(extension);
};

// Vérifier si un fichier est une vidéo
const isVideo = (filename) => {
  const extension = path.extname(filename).toLowerCase();
  return ['.mp4', '.mov', '.avi', '.webm', '.mkv'].includes(extension);
};

// Obtenir les dimensions d'une image
const getImageDimensions = async (filePath) => {
  try {
    const metadata = await sharp(filePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height
    };
  } catch (error) {
    logger.error(`Erreur lors de l'obtention des dimensions de l'image: ${error.message}`);
    return {
      width: 0,
      height: 0
    };
  }
};

// Redimensionner une image
const resizeImage = async (inputPath, outputPath, options) => {
  try {
    const { width, height, quality = 80, format = 'jpeg' } = options;
    
    await sharp(inputPath)
      .resize(width, height, {
        fit: 'cover',
        position: 'centre'
      })
      .toFormat(format, { quality })
      .toFile(outputPath);
    
    return true;
  } catch (error) {
    logger.error(`Erreur lors du redimensionnement de l'image: ${error.message}`);
    return false;
  }
};

// Créer un thumbnail pour une image
const createThumbnail = async (inputPath, outputPath, size = 200) => {
  try {
    await sharp(inputPath)
      .resize(size, size, {
        fit: 'cover',
        position: 'centre'
      })
      .toFormat('jpeg', { quality: 70 })
      .toFile(outputPath);
    
    return true;
  } catch (error) {
    logger.error(`Erreur lors de la création du thumbnail: ${error.message}`);
    return false;
  }
};

// Supprimer un fichier
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`Erreur lors de la suppression du fichier: ${error.message}`);
    return false;
  }
};

module.exports = {
  isImage,
  isVideo,
  getImageDimensions,
  resizeImage,
  createThumbnail,
  deleteFile
};
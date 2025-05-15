const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// Configuration du stockage des fichiers téléchargés
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    // Générer un nom de fichier unique
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${extension}`);
  }
});

// Filtre pour les types de fichiers autorisés
const fileFilter = (req, file, cb) => {
  // Vérifier le type MIME
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non pris en charge. Seuls les images et vidéos sont autorisés.'), false);
  }
};

// Limite de taille
const limits = {
  fileSize: 15 * 1024 * 1024, // 15 Mo
};

// Middleware d'upload
const upload = multer({
  storage,
  fileFilter,
  limits
});

// Gestionnaire d'erreurs pour multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Erreur de Multer
    logger.error(`Erreur Multer: ${err.message}`);
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Le fichier est trop volumineux (maximum 15 Mo)' });
    }
    
    return res.status(400).json({ message: `Erreur lors de l'upload: ${err.message}` });
  } else if (err) {
    // Autre erreur
    logger.error(`Erreur d'upload: ${err.message}`);
    return res.status(400).json({ message: err.message });
  }
  
  next();
};

module.exports = {
  upload,
  handleUploadError
};
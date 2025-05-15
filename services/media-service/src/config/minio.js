const Minio = require('minio');
const logger = require('../utils/logger');

// Configuration MinIO
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'minio',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
});

// Initialisation des buckets
const initializeBuckets = async () => {
  const buckets = [
    'profile-images',
    'message-media',
    'story-media'
  ];

  for (const bucket of buckets) {
    try {
      const exists = await minioClient.bucketExists(bucket);
      if (!exists) {
        await minioClient.makeBucket(bucket);
        logger.info(`Bucket '${bucket}' créé avec succès`);
      }
    } catch (error) {
      logger.error(`Erreur lors de la vérification/création du bucket '${bucket}': ${error.message}`);
    }
  }
};

module.exports = {
  minioClient,
  initializeBuckets
};
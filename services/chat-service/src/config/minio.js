const Minio = require('minio');

// Configuration MinIO
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'minio',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
});

// Création des buckets si nécessaire
const initializeBuckets = async () => {
  const buckets = [
    'profile-images',
    'message-media',
    'story-media'
  ];

  for (const bucket of buckets) {
    const exists = await minioClient.bucketExists(bucket);
    if (!exists) {
      await minioClient.makeBucket(bucket);
      console.log(`Bucket '${bucket}' created successfully.`);
    }
  }
};

// Initialiser les buckets au démarrage
initializeBuckets().catch(err => {
  console.error('Error initializing MinIO buckets:', err);
});

module.exports = { minioClient };
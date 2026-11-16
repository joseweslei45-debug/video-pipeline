import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 3000),
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT || 6379),
  },
  storageDriver: process.env.STORAGE_DRIVER || 'local',
  storageDir: process.env.STORAGE_DIR || 'storage',
  s3: {
    bucket: process.env.S3_BUCKET,
    region: process.env.AWS_REGION || 'us-east-1',
  },
  thumbnailCount: Number(process.env.THUMBNAIL_COUNT || 3),
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 200),
  workerConcurrency: Number(process.env.WORKER_CONCURRENCY || 2),
};

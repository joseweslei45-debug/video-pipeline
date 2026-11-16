import fs from 'node:fs';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const CONTENT_TYPES = {
  '.jpg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
};

export class S3Storage {
  constructor({ bucket, region }) {
    if (!bucket) throw new Error('Defina a variável S3_BUCKET para usar o driver s3');
    this.bucket = bucket;
    this.region = region;
    this.client = new S3Client({ region });
  }

  async save(key, sourcePath) {
    const { size } = await fs.promises.stat(sourcePath);
    const ext = key.slice(key.lastIndexOf('.')).toLowerCase();
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: fs.createReadStream(sourcePath),
        ContentLength: size,
        ContentType: CONTENT_TYPES[ext] || 'application/octet-stream',
      }),
    );
    return 'https://' + this.bucket + '.s3.' + this.region + '.amazonaws.com/' + key;
  }
}

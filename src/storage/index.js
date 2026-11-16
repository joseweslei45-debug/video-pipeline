import path from 'node:path';
import { config } from '../config.js';
import { LocalStorage } from './local.js';

/** Pasta servida publicamente em /files quando o driver é local. */
export const PUBLIC_DIR = path.resolve(config.storageDir, 'public');

export async function createStorage() {
  if (config.storageDriver === 's3') {
    const { S3Storage } = await import('./s3.js');
    return new S3Storage(config.s3);
  }
  return new LocalStorage(PUBLIC_DIR);
}

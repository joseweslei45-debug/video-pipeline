import { Queue } from 'bullmq';
import { config } from './config.js';

export const QUEUE_NAME = 'video-processing';
export const connection = config.redis;

export const videoQueue = new Queue(QUEUE_NAME, { connection });

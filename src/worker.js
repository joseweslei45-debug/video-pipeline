import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Worker } from 'bullmq';
import { config } from './config.js';
import { extractFrame, probe } from './ffmpeg.js';
import { QUEUE_NAME, connection } from './queue.js';
import { createStorage } from './storage/index.js';
import { formatDuration, thumbnailTimestamps } from './thumbnails.js';

const storage = await createStorage();

async function processVideo(job) {
  const { id, path: input } = job.data;

  const meta = await probe(input);
  await job.updateProgress(10);

  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'thumbs-'));
  try {
    const stamps = thumbnailTimestamps(meta.duration, config.thumbnailCount);
    const thumbnails = [];

    for (const [i, second] of stamps.entries()) {
      const name = 'thumb-' + (i + 1) + '.jpg';
      const output = path.join(tmp, name);
      await extractFrame(input, second, output);
      thumbnails.push({ segundo: second, url: await storage.save('videos/' + id + '/' + name, output) });
      await job.updateProgress(10 + Math.round((80 * (i + 1)) / stamps.length));
    }

    const original = await storage.save('videos/' + id + '/original' + path.extname(input), input);
    await fs.rm(input, { force: true });
    await job.updateProgress(100);

    return {
      duracao: formatDuration(meta.duration),
      resolucao: meta.width + 'x' + meta.height,
      codec: meta.codec,
      original,
      thumbnails,
    };
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
}

const worker = new Worker(QUEUE_NAME, processVideo, {
  connection,
  concurrency: config.workerConcurrency,
});

worker.on('completed', (job) => console.log('✔ ' + job.id + ' processado'));
worker.on('failed', (job, err) => console.error('✖ ' + (job ? job.id : '?') + ': ' + err.message));

console.log('Worker aguardando vídeos na fila "' + QUEUE_NAME + '"...');

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    await worker.close();
    process.exit(0);
  });
}

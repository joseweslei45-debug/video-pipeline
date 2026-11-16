import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import multer from 'multer';
import { config } from './config.js';
import { videoQueue } from './queue.js';
import { PUBLIC_DIR } from './storage/index.js';

const uploadDir = path.resolve(config.storageDir, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => cb(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase()),
  }),
  limits: { fileSize: config.maxUploadMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith('video/')),
});

const app = express();
app.use(express.static(path.resolve('public')));
app.use('/files', express.static(PUBLIC_DIR));

app.post('/api/videos', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ erro: 'Envie um arquivo de vídeo no campo "video"' });
  }
  const id = path.parse(req.file.filename).name;
  await videoQueue.add(
    'process',
    { id, path: req.file.path, originalName: req.file.originalname },
    {
      jobId: id,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { age: 24 * 3600 },
      removeOnFail: { age: 24 * 3600 },
    },
  );
  res.status(202).location('/api/videos/' + id).json({ id, status: 'waiting' });
});

app.get('/api/videos/:id', async (req, res) => {
  const job = await videoQueue.getJob(req.params.id);
  if (!job) return res.status(404).json({ erro: 'Vídeo não encontrado' });
  res.json({
    id: job.id,
    status: await job.getState(),
    progresso: job.progress,
    arquivo: job.data.originalName,
    tentativas: job.attemptsMade,
    resultado: job.returnvalue ?? null,
    erro: job.failedReason ?? null,
  });
});

app.get('/api/stats', async (req, res) => {
  res.json(await videoQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed'));
});

app.use((err, req, res, next) => {
  const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 500;
  res.status(status).json({ erro: err.message });
});

app.listen(config.port, () => {
  console.log('API ouvindo em http://localhost:' + config.port);
});

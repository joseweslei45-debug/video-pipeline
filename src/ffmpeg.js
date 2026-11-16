import { spawn } from 'node:child_process';

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);
    let out = '';
    let err = '';
    proc.stdout.on('data', (d) => (out += d));
    proc.stderr.on('data', (d) => (err += d));
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(cmd + ' terminou com código ' + code + ': ' + err.slice(-500)));
    });
  });
}

/** Lê duração, resolução e codec do vídeo. */
export async function probe(file) {
  const out = await run('ffprobe', [
    '-v', 'error',
    '-print_format', 'json',
    '-show_format',
    '-show_streams',
    file,
  ]);
  const info = JSON.parse(out);
  const video = info.streams.find((s) => s.codec_type === 'video');
  if (!video) throw new Error('O arquivo não contém trilha de vídeo');
  return {
    duration: Number(info.format.duration),
    width: video.width,
    height: video.height,
    codec: video.codec_name,
    sizeBytes: Number(info.format.size),
  };
}

/** Extrai um único frame em JPEG redimensionado para a largura informada. */
export function extractFrame(file, seconds, output, width = 640) {
  return run('ffmpeg', [
    '-y',
    '-ss', String(seconds),
    '-i', file,
    '-frames:v', '1',
    '-vf', 'scale=' + width + ':-2',
    '-q:v', '3',
    output,
  ]);
}

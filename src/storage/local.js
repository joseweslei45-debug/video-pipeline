import fs from 'node:fs/promises';
import path from 'node:path';

export class LocalStorage {
  constructor(baseDir) {
    this.baseDir = baseDir;
  }

  /** Copia o arquivo para o storage e devolve a URL pública. */
  async save(key, sourcePath) {
    const dest = path.join(this.baseDir, key);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(sourcePath, dest);
    return '/files/' + key;
  }
}

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatDuration, thumbnailTimestamps } from '../src/thumbnails.js';

describe('thumbnailTimestamps', () => {
  it('distribui as capturas respeitando 10% de margem', () => {
    assert.deepEqual(thumbnailTimestamps(100, 3), [10, 50, 90]);
  });

  it('usa o meio do vídeo quando só há uma captura', () => {
    assert.deepEqual(thumbnailTimestamps(100, 1), [50]);
  });

  it('arredonda para duas casas decimais', () => {
    assert.deepEqual(thumbnailTimestamps(10, 4), [1, 3.67, 6.33, 9]);
  });

  it('rejeita duração ou quantidade inválidas', () => {
    assert.throws(() => thumbnailTimestamps(0, 3));
    assert.throws(() => thumbnailTimestamps(Number.NaN, 3));
    assert.throws(() => thumbnailTimestamps(100, 0));
    assert.throws(() => thumbnailTimestamps(100, 1.5));
  });
});

describe('formatDuration', () => {
  it('formata minutos e segundos', () => {
    assert.equal(formatDuration(65), '01:05');
  });

  it('inclui horas quando necessário', () => {
    assert.equal(formatDuration(3661.9), '1:01:01');
  });
});

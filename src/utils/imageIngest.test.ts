import { describe, expect, it, vi, afterEach } from 'vitest';
import { defaultNameSettings, DEFAULT_IMAGE_FOCUS } from '../types';
import {
  applyReplacedImage,
  classifyImageFile,
  createCardFromImageFile,
  ingestImageFiles,
} from './imageIngest';

const jpeg = (name = 'hero.jpg') => new File([new Uint8Array([1, 2, 3])], name, { type: 'image/jpeg' });
const heic = (name = 'shot.heic') => new File([new Uint8Array([1])], name, { type: 'image/heic' });
const text = (name = 'notes.txt') => new File([new Uint8Array([1])], name, { type: 'text/plain' });

describe('classifyImageFile', () => {
  it('accepts jpeg, png and webp', () => {
    expect(classifyImageFile(jpeg())).toBe('native');
    expect(classifyImageFile(new File([], 'a.png', { type: 'image/png' }))).toBe('native');
    expect(classifyImageFile(new File([], 'a.webp', { type: 'image/webp' }))).toBe('native');
  });

  it('detects heic by type or extension', () => {
    expect(classifyImageFile(heic())).toBe('heic');
    expect(classifyImageFile(new File([], 'photo.HEIF', { type: '' }))).toBe('heic');
  });

  it('rejects unrelated files', () => {
    expect(classifyImageFile(text())).toBe('rejected');
  });
});

describe('ingestImageFiles', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('skips rejected types and keeps valid images', async () => {
    vi.stubGlobal('URL', {
      createObjectURL: () => 'blob:ok',
      revokeObjectURL: vi.fn(),
    });
    const { cards, errors } = await ingestImageFiles([text(), jpeg()]);
    expect(cards).toHaveLength(1);
    expect(cards[0].imageUrl).toBe('blob:ok');
    expect(errors[0]).toMatch(/notes\.txt/);
  });
});

describe('card image helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates a card with centered cover focus', () => {
    vi.stubGlobal('URL', {
      createObjectURL: () => 'blob:new',
      revokeObjectURL: vi.fn(),
    });
    const card = createCardFromImageFile(jpeg());
    expect(card.imageUrl).toBe('blob:new');
    expect(card.imageFillMode).toBe('cover');
    expect(card.imageFocus).toEqual(DEFAULT_IMAGE_FOCUS);
    expect(card.nameSettings).toEqual(defaultNameSettings);
  });

  it('keeps settings when replacing an image and resets focus', () => {
    const revoke = vi.fn();
    let n = 0;
    vi.stubGlobal('URL', {
      createObjectURL: () => `blob:${++n}`,
      revokeObjectURL: revoke,
    });
    const original = createCardFromImageFile(jpeg('old.jpg'));
    original.nameSettings = { ...original.nameSettings, enabled: true, name: 'Ада' };
    original.imageFillMode = 'fitWidth';
    original.imageFocus = { x: 0.2, y: 0.8 };
    original.dndStats = { ...original.dndStats!, enabled: true };

    const next = applyReplacedImage(original, jpeg('new.jpg'));
    expect(revoke).toHaveBeenCalledWith('blob:1');
    expect(next.id).toBe(original.id);
    expect(next.imageUrl).toBe('blob:2');
    expect(next.nameSettings.name).toBe('Ада');
    expect(next.imageFillMode).toBe('fitWidth');
    expect(next.imageFocus).toEqual(DEFAULT_IMAGE_FOCUS);
    expect(next.dndStats?.enabled).toBe(true);
  });
});

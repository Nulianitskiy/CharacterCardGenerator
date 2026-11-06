import { describe, expect, it, vi, afterEach } from 'vitest';
import { defaultNameSettings, DEFAULT_IMAGE_FOCUS } from '../types';
import {
  applyReplacedImage,
  applyReplacedObjectImage,
  classifyImageFile,
  createCardFromImageFile,
  createObjectFromImageFile,
  ingestImageFiles,
  ingestImageFilesAsObjects,
  objectNameFromFile,
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
    expect(card.pawnSize).toBe('medium');
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

describe('object image helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('suggests a display name from the file name', () => {
    expect(objectNameFromFile(jpeg('iron_ring.png'))).toBe('Iron ring');
    expect(objectNameFromFile(jpeg('Зелье-невидимости.jpg'))).toBe('Зелье невидимости');
    expect(objectNameFromFile(jpeg('   .jpg'))).toBe('');
  });

  it('creates an object with empty text fields and no badge', () => {
    vi.stubGlobal('URL', {
      createObjectURL: () => 'blob:obj',
      revokeObjectURL: vi.fn(),
    });
    const object = createObjectFromImageFile(jpeg('potion.png'));
    expect(object.imageUrl).toBe('blob:obj');
    expect(object.name).toBe('Potion');
    expect(object.slogan).toBe('');
    expect(object.description).toBe('');
    expect(object.quantity).toBeNull();
    expect(object.theme).toBe('ruby');
  });

  it('ingests files into objects, reporting rejected types', async () => {
    vi.stubGlobal('URL', {
      createObjectURL: () => 'blob:ok',
      revokeObjectURL: vi.fn(),
    });
    const { items, errors } = await ingestImageFilesAsObjects([text(), jpeg('a.jpg'), jpeg('b.png')]);
    expect(items).toHaveLength(2);
    expect(items[0].name).toBe('A');
    expect(items[1].name).toBe('b'.toUpperCase());
    expect(errors[0]).toMatch(/notes\.txt/);
  });

  it('replaces an object image without touching text fields', () => {
    const revoke = vi.fn();
    let n = 0;
    vi.stubGlobal('URL', {
      createObjectURL: () => `blob:${++n}`,
      revokeObjectURL: revoke,
    });
    const original = createObjectFromImageFile(jpeg('old.jpg'));
    original.description = 'Длинный текст';
    original.quantity = 3;

    const next = applyReplacedObjectImage(original, jpeg('new.jpg'));
    expect(revoke).toHaveBeenCalledWith('blob:1');
    expect(next.id).toBe(original.id);
    expect(next.imageUrl).toBe('blob:2');
    expect(next.description).toBe('Длинный текст');
    expect(next.quantity).toBe(3);
  });
});

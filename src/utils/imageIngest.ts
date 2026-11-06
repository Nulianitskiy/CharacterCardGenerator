import type { CharacterCard, GameObject } from '../types';
import {
  DEFAULT_IMAGE_FOCUS,
  DEFAULT_OBJECT_THEME,
  DEFAULT_PAWN_SIZE,
  defaultNameSettings,
} from '../types';
import { generateId } from './generateId';
import { createDefaultDndStats } from './dndStats';
import { get2dContext } from './canvas2d';

const NATIVE_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const HEIC_IMAGE_TYPES = new Set(['image/heic', 'image/heif']);

export type ImageFileKind = 'native' | 'heic' | 'rejected';

const nativeExtensions = /\.(jpe?g|png|webp)$/i;
const heicExtensions = /\.(heic|heif)$/i;

export const classifyImageFile = (file: File): ImageFileKind => {
  const type = (file.type || '').toLowerCase();
  if (NATIVE_IMAGE_TYPES.has(type)) return 'native';
  if (HEIC_IMAGE_TYPES.has(type)) return 'heic';
  const name = file.name.toLowerCase();
  if (heicExtensions.test(name)) return 'heic';
  if (nativeExtensions.test(name)) return 'native';
  return 'rejected';
};

export const createCardFromImageFile = (file: File): CharacterCard => ({
  id: generateId(),
  file,
  imageUrl: URL.createObjectURL(file),
  nameSettings: { ...defaultNameSettings },
  imageFillMode: 'cover',
  imageFocus: { ...DEFAULT_IMAGE_FOCUS },
  dndStats: createDefaultDndStats(),
  pawnSize: DEFAULT_PAWN_SIZE,
});

export const applyReplacedImage = (card: CharacterCard, file: File): CharacterCard => {
  URL.revokeObjectURL(card.imageUrl);
  return {
    ...card,
    file,
    imageUrl: URL.createObjectURL(file),
    imageFocus: { ...DEFAULT_IMAGE_FOCUS },
  };
};

/** Default object name suggestion from the file name: "iron_ring.png" → "Iron ring". */
export const objectNameFromFile = (file: File): string => {
  const base = file
    .name.replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!base) return '';
  return base.charAt(0).toUpperCase() + base.slice(1);
};

export const createObjectFromImageFile = (file: File): GameObject => ({
  id: generateId(),
  file,
  imageUrl: URL.createObjectURL(file),
  name: objectNameFromFile(file),
  slogan: '',
  description: '',
  quantity: null,
  theme: DEFAULT_OBJECT_THEME,
});

export const applyReplacedObjectImage = (object: GameObject, file: File): GameObject => {
  URL.revokeObjectURL(object.imageUrl);
  return { ...object, file, imageUrl: URL.createObjectURL(file) };
};

const convertHeicToJpeg = async (file: File): Promise<File> => {
  if (typeof createImageBitmap !== 'function') {
    throw new Error('heic-unsupported');
  }
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = get2dContext(canvas);
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close?.();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error('heic-encode'))),
      'image/jpeg',
      0.92
    );
  });
  const base = file.name.replace(heicExtensions, '') || 'image';
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg' });
};

export const prepareImageFile = async (file: File): Promise<File> => {
  const kind = classifyImageFile(file);
  if (kind === 'native') return file;
  if (kind === 'heic') return convertHeicToJpeg(file);
  throw new Error('unsupported-type');
};

const formatRejectedList = (names: string[]): string =>
  `Не удалось загрузить: ${names.join(', ')}. Поддерживаются JPG, PNG, WEBP и HEIC.`;

const heicError = (name: string): string =>
  `${name || 'HEIC'}: не удалось прочитать. Экспортируйте в JPG.`;

export const ingestImageFiles = async (
  files: Iterable<File>
): Promise<{ cards: CharacterCard[]; errors: string[] }> => {
  const { items, errors } = await ingestFilesGeneric(files, createCardFromImageFile);
  return { cards: items, errors };
};

/** Same pipeline as card ingest, but producing GameObject entries. */
export const ingestImageFilesAsObjects = (
  files: Iterable<File>
): Promise<{ items: GameObject[]; errors: string[] }> =>
  ingestFilesGeneric(files, createObjectFromImageFile);

const ingestFilesGeneric = async <T>(
  files: Iterable<File>,
  makeItem: (prepared: File) => T
): Promise<{ items: T[]; errors: string[] }> => {
  const errors: string[] = [];
  const items: T[] = [];
  const rejectedNames: string[] = [];

  for (const file of files) {
    const kind = classifyImageFile(file);
    if (kind === 'rejected') {
      rejectedNames.push(file.name || 'файл');
      continue;
    }
    try {
      items.push(makeItem(await prepareImageFile(file)));
    } catch {
      errors.push(heicError(file.name));
    }
  }

  if (rejectedNames.length > 0) {
    errors.unshift(formatRejectedList(rejectedNames));
  }

  return { items, errors };
};

export const ingestReplacementAndExtras = async (
  files: File[]
): Promise<{ replacement: File | null; extraCards: CharacterCard[]; errors: string[] }> => {
  if (files.length === 0) {
    return { replacement: null, extraCards: [], errors: [] };
  }
  const [first, ...rest] = files;
  const errors: string[] = [];
  let replacement: File | null = null;

  try {
    replacement = await prepareImageFile(first);
  } catch {
    if (classifyImageFile(first) === 'rejected') {
      errors.push(formatRejectedList([first.name || 'файл']));
    } else {
      errors.push(heicError(first.name));
    }
  }

  const extras = await ingestImageFiles(rest);
  return {
    replacement,
    extraCards: extras.cards,
    errors: [...errors, ...extras.errors],
  };
};

export const filesFromClipboard = (event: ClipboardEvent): File[] => {
  const files: File[] = [];
  const items = event.clipboardData?.items;
  if (!items) return files;
  for (const item of items) {
    if (item.kind !== 'file') continue;
    const file = item.getAsFile();
    if (file) files.push(file);
  }
  return files;
};

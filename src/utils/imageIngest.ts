import type { CharacterCard } from '../types';
import { DEFAULT_IMAGE_FOCUS, defaultNameSettings } from '../types';
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
  const errors: string[] = [];
  const cards: CharacterCard[] = [];
  const rejectedNames: string[] = [];

  for (const file of files) {
    const kind = classifyImageFile(file);
    if (kind === 'rejected') {
      rejectedNames.push(file.name || 'файл');
      continue;
    }
    try {
      const prepared = await prepareImageFile(file);
      cards.push(createCardFromImageFile(prepared));
    } catch {
      errors.push(heicError(file.name));
    }
  }

  if (rejectedNames.length > 0) {
    errors.unshift(formatRejectedList(rejectedNames));
  }

  return { cards, errors };
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

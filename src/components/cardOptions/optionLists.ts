import { CARD_SIDE_LABELS, type CardSide, type FontOption, type ImageFillMode, type NameDisplaySide, type NameFontValue, type ObjectTheme, type PawnSize } from '../../types';
import { PRESET_OVERLAYS } from '../../utils/presetOverlays';
import { makeLocalNameFont, SYSTEM_FONT_STACKS, type NameFontChoice } from '../../utils/nameFont';

export const FONT_OPTIONS: { value: FontOption; label: string }[] = [
  { value: 'medieval', label: 'Old Standard TT' },
  { value: 'elegant', label: 'Georgia' },
  { value: 'fantasy', label: 'Times New Roman' },
  { value: 'royal', label: 'Arial' },
  { value: 'script', label: 'Verdana' },
  { value: 'ancient', label: 'Trebuchet MS' },
  { value: 'inscription', label: 'Palatino' },
  { value: 'bold', label: 'Courier New' },
];

export const BUILTIN_FONT_CHOICES: NameFontChoice[] = FONT_OPTIONS.map((option) => ({
  value: option.value as NameFontValue,
  label: option.label,
}));

const BUILTIN_LABELS: ReadonlySet<string> = new Set(
  FONT_OPTIONS.map((option) => option.label.toLowerCase())
);

/**
 * Always-available wide list of common system fonts. Shown in the picker next
 * to the built-in presets and used as a fallback where Local Font Access is
 * unsupported (Firefox, Safari). Families already covered by the presets are
 * not repeated here.
 */
export const SYSTEM_FONT_CHOICES: NameFontChoice[] = SYSTEM_FONT_STACKS.filter(
  (entry) => !BUILTIN_LABELS.has(entry.family.toLowerCase())
).map((entry) => ({
  value: makeLocalNameFont(entry.family),
  label: entry.family,
}));

export const DISPLAY_SIDE_OPTIONS: { value: NameDisplaySide; label: string }[] = [
  { value: 'a', label: CARD_SIDE_LABELS.a },
  { value: 'b', label: CARD_SIDE_LABELS.b },
  { value: 'both', label: 'Обе' },
];

export const STATS_SIDE_OPTIONS: { value: CardSide; label: string }[] = [
  { value: 'a', label: CARD_SIDE_LABELS.a },
  { value: 'b', label: CARD_SIDE_LABELS.b },
];

export const IMAGE_FILL_OPTIONS: { value: ImageFillMode; label: string }[] = [
  { value: 'cover', label: 'Заполнить (обрезка)' },
  { value: 'fitWidth', label: 'По ширине' },
  { value: 'fitHeight', label: 'По высоте' },
];

export const PAWN_SIZE_OPTIONS: { value: PawnSize; label: string }[] = [
  { value: 'medium', label: 'Средний' },
  { value: 'large', label: 'Большой' },
  { value: 'huge', label: 'Огромный' },
];

export const OBJECT_THEME_OPTIONS: { value: ObjectTheme; label: string }[] = [
  { value: 'common', label: 'Обычное' },
  { value: 'uncommon', label: 'Необычное' },
  { value: 'rare', label: 'Редкое' },
  { value: 'very_rare', label: 'Очень редкое' },
  { value: 'legendary', label: 'Легендарное' },
  { value: 'artifact', label: 'Сюжетное' },
];

export const FULL_PRESETS = Object.values(PRESET_OVERLAYS).filter((preset) => preset.kind === 'full');
export const LOWER_PRESETS = Object.values(PRESET_OVERLAYS).filter((preset) => preset.kind === 'lower');

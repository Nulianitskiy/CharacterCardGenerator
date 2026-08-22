import { CARD_SIDE_LABELS, type BlockSizeOption, type CardSide, type FontOption, type ImageFillMode, type NameDisplaySide } from '../../types';
import { PRESET_OVERLAYS } from '../../utils/presetOverlays';

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

export const BLOCK_SIZE_OPTIONS: { value: BlockSizeOption; label: string }[] = [
  { value: 'small', label: 'S' },
  { value: 'medium', label: 'M' },
  { value: 'large', label: 'L' },
];

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

export const FULL_PRESETS = Object.values(PRESET_OVERLAYS).filter((preset) => preset.kind === 'full');
export const LOWER_PRESETS = Object.values(PRESET_OVERLAYS).filter((preset) => preset.kind === 'lower');

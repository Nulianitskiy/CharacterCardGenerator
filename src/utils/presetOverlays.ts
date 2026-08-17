import type { NameBackgroundType } from '../types';

export type PresetOverlayId =
  | 'sketch'
  | 'gothic'
  | 'celestial'
  | 'forest'
  | 'arcane'
  | 'infernal'
  | 'frost'
  | 'dwarven'
  | 'steampunk'
  | 'nautical'
  | 'lower-tavern'
  | 'lower-alchemist'
  | 'lower-parchment'
  | 'lower-silver'
  | 'lower-arcane'
  | 'lower-royal'
  | 'lower-wild'
  | 'lower-infernal';

export type PresetOverlayKind = 'full' | 'lower';

const presetAsset = (filename: string): string =>
  `${import.meta.env.BASE_URL}presets/${filename}`;

export interface OverlayNameBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PresetOverlayMeta {
  id: PresetOverlayId;
  src: string;
  label: string;
  kind: PresetOverlayKind;
  nameBox: OverlayNameBox;
  textColor: string;
}

export const PRESET_OVERLAYS: Record<PresetOverlayId, PresetOverlayMeta> = {
  sketch: {
    id: 'sketch',
    src: presetAsset('sketch.png'),
    label: 'Гравюра',
    kind: 'full',
    nameBox: { x: 0.22, y: 0.84, w: 0.56, h: 0.12 },
    textColor: '#1a1612',
  },
  gothic: {
    id: 'gothic',
    src: presetAsset('gothic.png'),
    label: 'Готический',
    kind: 'full',
    nameBox: { x: 0.15, y: 0.81, w: 0.7, h: 0.14 },
    textColor: '#1a1612',
  },
  celestial: {
    id: 'celestial',
    src: presetAsset('celestial.png'),
    label: 'Небесный',
    kind: 'full',
    nameBox: { x: 0.2, y: 0.83, w: 0.6, h: 0.13 },
    textColor: '#1a1612',
  },
  forest: {
    id: 'forest',
    src: presetAsset('forest.png'),
    label: 'Лесной',
    kind: 'full',
    nameBox: { x: 0.19, y: 0.81, w: 0.62, h: 0.14 },
    textColor: '#2a1c10',
  },
  arcane: {
    id: 'arcane',
    src: presetAsset('arcane.png'),
    label: 'Арканический',
    kind: 'full',
    nameBox: { x: 0.16, y: 0.83, w: 0.68, h: 0.13 },
    textColor: '#271632',
  },
  infernal: {
    id: 'infernal',
    src: presetAsset('infernal.png'),
    label: 'Инфернальный',
    kind: 'full',
    nameBox: { x: 0.15, y: 0.82, w: 0.7, h: 0.12 },
    textColor: '#21130d',
  },
  frost: {
    id: 'frost',
    src: presetAsset('frost.png'),
    label: 'Ледяной',
    kind: 'full',
    nameBox: { x: 0.17, y: 0.83, w: 0.66, h: 0.11 },
    textColor: '#14243a',
  },
  dwarven: {
    id: 'dwarven',
    src: presetAsset('dwarven.png'),
    label: 'Дворфийский',
    kind: 'full',
    nameBox: { x: 0.15, y: 0.84, w: 0.7, h: 0.11 },
    textColor: '#2a1a10',
  },
  steampunk: {
    id: 'steampunk',
    src: presetAsset('steampunk.png'),
    label: 'Стимпанк',
    kind: 'full',
    nameBox: { x: 0.14, y: 0.83, w: 0.72, h: 0.13 },
    textColor: '#2a1808',
  },
  nautical: {
    id: 'nautical',
    src: presetAsset('nautical.png'),
    label: 'Морской',
    kind: 'full',
    nameBox: { x: 0.17, y: 0.83, w: 0.66, h: 0.12 },
    textColor: '#2a1b0d',
  },
  'lower-tavern': {
    id: 'lower-tavern',
    src: presetAsset('lower-tavern.png'),
    label: 'Таверна',
    kind: 'lower',
    nameBox: { x: 0.22, y: 0.78, w: 0.56, h: 0.12 },
    textColor: '#2a1a0d',
  },
  'lower-alchemist': {
    id: 'lower-alchemist',
    src: presetAsset('lower-alchemist.png'),
    label: 'Алхимия',
    kind: 'lower',
    nameBox: { x: 0.22, y: 0.81, w: 0.56, h: 0.11 },
    textColor: '#2a1a0d',
  },
  'lower-parchment': {
    id: 'lower-parchment',
    src: presetAsset('lower-parchment.png'),
    label: 'Пергамент',
    kind: 'lower',
    nameBox: { x: 0.22, y: 0.78, w: 0.56, h: 0.15 },
    textColor: '#2a1a0d',
  },
  'lower-silver': {
    id: 'lower-silver',
    src: presetAsset('lower-silver.png'),
    label: 'Классическая',
    kind: 'lower',
    nameBox: { x: 0.08, y: 0.835, w: 0.84, h: 0.11 },
    textColor: '#24201b',
  },
  'lower-arcane': {
    id: 'lower-arcane',
    src: presetAsset('lower-arcane.png'),
    label: 'Магическая',
    kind: 'lower',
    nameBox: { x: 0.22, y: 0.78, w: 0.56, h: 0.13 },
    textColor: '#271632',
  },
  'lower-royal': {
    id: 'lower-royal',
    src: presetAsset('lower-royal.png'),
    label: 'Королевская',
    kind: 'lower',
    nameBox: { x: 0.22, y: 0.78, w: 0.56, h: 0.12 },
    textColor: '#2a1a0d',
  },
  'lower-wild': {
    id: 'lower-wild',
    src: presetAsset('lower-wild.png'),
    label: 'Дикая природа',
    kind: 'lower',
    nameBox: { x: 0.22, y: 0.79, w: 0.56, h: 0.13 },
    textColor: '#2a1a0d',
  },
  'lower-infernal': {
    id: 'lower-infernal',
    src: presetAsset('lower-infernal.png'),
    label: 'Инфернальная',
    kind: 'lower',
    nameBox: { x: 0.16, y: 0.79, w: 0.68, h: 0.13 },
    textColor: '#251710',
  },
};

export const isPresetBackground = (bg: NameBackgroundType): bg is PresetOverlayId =>
  bg in PRESET_OVERLAYS;

export const getPresetOverlay = (bg: NameBackgroundType): PresetOverlayMeta | null =>
  isPresetBackground(bg) ? PRESET_OVERLAYS[bg] : null;

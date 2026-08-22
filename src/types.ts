/**
 * Available font options for character name
 */
export type FontOption =
  | 'medieval'
  | 'elegant'
  | 'fantasy'
  | 'royal'
  | 'script'
  | 'ancient'
  | 'inscription'
  | 'bold';

/**
 * Name block size options
 */
export type BlockSizeOption = 'small' | 'medium' | 'large';

/**
 * Decorative frame / name plate presets
 */
export type NameBackgroundType =
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

/**
 * Foldable card faces: A is the right half on the sheet, B is the left.
 */
export type CardSide = 'a' | 'b';

/**
 * Which side of the card to display the name on
 */
export type NameDisplaySide = CardSide | 'both';

export const CARD_SIDE_LABELS: Record<CardSide, string> = {
  a: 'Сторона А',
  b: 'Сторона Б',
};

/**
 * D&D 5e ability score keys
 */
export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export type AbilityScores = Record<AbilityKey, number | null>;

/**
 * Compact D&D stat block shown instead of a portrait on one card face
 */
export interface DndStatsSettings {
  enabled: boolean;
  displaySide: CardSide;
  ac: number | null;
  abilities: AbilityScores;
  classLevel: string;
  race: string;
  spellSaveDc: number | null;
  speed: string;
  hpMax: number | null;
  initiative: number | null;
  passivePerception: number | null;
}

/**
 * How the image fills the card area: cover (crop to fill), fit by width, or fit by height
 */
export type ImageFillMode = 'cover' | 'fitWidth' | 'fitHeight';

/**
 * Which point of the photo sits at the center of a cover crop (0–1).
 */
export interface ImageFocus {
  x: number;
  y: number;
}

export const DEFAULT_IMAGE_FOCUS: ImageFocus = { x: 0.5, y: 0.5 };

/**
 * Settings for the character name display
 */
export interface NameSettings {
  enabled: boolean;
  name: string;
  font: FontOption;
  blockSize: BlockSizeOption;
  background: NameBackgroundType;
  displaySide: NameDisplaySide;
}

/**
 * Represents an uploaded character image that will become a card
 */
export interface CharacterCard {
  id: string;
  file: File;
  imageUrl: string;
  nameSettings: NameSettings;
  /** How to fit the image inside the card half (default: cover) */
  imageFillMode?: ImageFillMode;
  /** Cover-crop focus; ignored for fitWidth / fitHeight */
  imageFocus?: ImageFocus;
  /** Optional D&D stat block replacing one card face */
  dndStats?: DndStatsSettings;
}

/**
 * Default name settings for new cards
 */
export const defaultNameSettings: NameSettings = {
  enabled: false,
  name: '',
  font: 'medieval',
  blockSize: 'large',
  background: 'gothic',
  displaySide: 'a',
};

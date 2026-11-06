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
 * A font family installed on the user's device (picked via the font picker,
 * e.g. through the Local Font Access API). `localFamily` is a sanitized
 * CSS font-family name.
 */
export interface LocalNameFont {
  readonly localFamily: string;
}

/**
 * Name font: one of the built-in presets or any font family found on the device
 */
export type NameFontValue = FontOption | LocalNameFont;

/**
 * Name font size as a percentage of the plate's auto-fit maximum.
 * 72/86/100 correspond to the former S/M/L presets; longer names still shrink
 * automatically so they fit the name box.
 */
export const MIN_NAME_FONT_SIZE_PERCENT = 25;
export const MAX_NAME_FONT_SIZE_PERCENT = 300;
export const DEFAULT_NAME_FONT_SIZE_PERCENT = 100;

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
 * Pawn print size on the sheet grid.
 * Medium: 1×1 cell. Large: 2 cells wide. Huge: 2×2 cells (twice a medium in both directions).
 */
export type PawnSize = 'medium' | 'large' | 'huge';

export const DEFAULT_PAWN_SIZE: PawnSize = 'medium';

/**
 * Quality / rarity tier of a physical object card (shirt + description pair),
 * inspired by Baldur's Gate 3 item rarities. Palettes and frame patterns live
 * in `constants.ts` (`OBJECT_PALETTES`) and are read by both renderers.
 */
export type ObjectTheme =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'very_rare'
  | 'legendary'
  | 'artifact';

export const DEFAULT_OBJECT_THEME: ObjectTheme = 'common';

/**
 * One physical object card: glued pair of a «shirt» (image, name, slogan,
 * optional quantity badge) and a «description» face (justified text in a frame).
 */
export interface GameObject {
  id: string;
  /** Portrait-like source image of the item. */
  file: File;
  /** Blob URL lifecycle follows the same rules as `CharacterCard.imageUrl`. */
  imageUrl: string;
  /** Item name, rendered on both faces. */
  name: string;
  /** Flavor line on the shirt scroll; empty scroll hides the banner. */
  slogan: string;
  /** Body text on the description face. */
  description: string;
  /** Optional «n штук» badge on the shirt; null hides it. */
  quantity: number | null;
  theme: ObjectTheme;
  /** How to fit the item image inside the shirt window (default: cover). */
  imageFillMode?: ImageFillMode;
  /** Cover-crop focus; ignored for fitWidth / fitHeight. */
  imageFocus?: ImageFocus;
  /** Optional primary combat/item stat (e.g. «1к8 + 1», «КД 16», «2к4 + 2»). */
  stat?: string;
  /** Optional weight tag (e.g. «1.5 фн.»). */
  weight?: string;
  /** Optional gold/value tag (e.g. «150 зм»). */
  price?: string;
  /** Whether the item requires attunement («Требует настройки»). */
  attunement?: boolean;
}

/**
 * Settings for the character name display
 */
export interface NameSettings {
  enabled: boolean;
  name: string;
  font: NameFontValue;
  /** Name font size in percent (see MIN/MAX/DEFAULT_NAME_FONT_SIZE_PERCENT) */
  fontSizePercent: number;
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
  /** Pawn size on the sheet; ignored for initiative cards */
  pawnSize?: PawnSize;
}

/**
 * Default name settings for new cards
 */
export const defaultNameSettings: NameSettings = {
  enabled: false,
  name: '',
  font: 'medieval',
  fontSizePercent: DEFAULT_NAME_FONT_SIZE_PERCENT,
  background: 'gothic',
  displaySide: 'a',
};

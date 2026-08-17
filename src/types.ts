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
 * Background style options for the name label
 */
export type NameBackgroundType =
  | 'gradient-dark'
  | 'gradient-gold'
  | 'gradient-red'
  | 'gradient-emerald'
  | 'gradient-arcane'
  | 'gradient-ice'
  | 'gradient-fire'
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
 * Which side of the card to display the name on
 */
export type NameDisplaySide = 'player' | 'gm' | 'both';

/**
 * How the image fills the card area: cover (crop to fill), fit by width, or fit by height
 */
export type ImageFillMode = 'cover' | 'fitWidth' | 'fitHeight';

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
  displaySide: 'player',
};

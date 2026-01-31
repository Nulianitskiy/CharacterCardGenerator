/**
 * Available font options for character name
 */
export type FontOption = 'medieval' | 'elegant' | 'bold' | 'fantasy';

/**
 * Name block size options
 */
export type BlockSizeOption = 'small' | 'medium' | 'large';

/**
 * Background style options for the name label
 */
export type NameBackgroundType = 'gradient-dark' | 'gradient-gold' | 'gradient-red' | 'scroll' | 'banner' | 'shield';

/**
 * Which side of the card to display the name on
 */
export type NameDisplaySide = 'player' | 'gm' | 'both';

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
}

/**
 * Default name settings for new cards
 */
export const defaultNameSettings: NameSettings = {
  enabled: false,
  name: '',
  font: 'medieval',
  blockSize: 'medium',
  background: 'gradient-dark',
  displaySide: 'player',
};

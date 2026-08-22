/**
 * Card and PDF dimension constants
 * All measurements in millimeters unless otherwise noted
 */

// A4 page dimensions
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

// Layout options
export type CardsPerPageOption = 4 | 20;

// Cut line width (white lines between cards for cutting guide)
export const CUT_LINE_WIDTH_MM = 0.5;

/** Top and bottom margins on PDF (0.5 cm each) */
export const PAGE_MARGIN_Y_MM = 5;

/** Side margins on PDF (0.5 cm each) */
export const PAGE_MARGIN_X_MM = 5;

/** Usable width for cards between left and right margins */
export const CONTENT_WIDTH_MM = A4_WIDTH_MM - 2 * PAGE_MARGIN_X_MM;

/** Usable height for cards between top and bottom margins */
export const CONTENT_HEIGHT_MM = A4_HEIGHT_MM - 2 * PAGE_MARGIN_Y_MM;

// Card width matches content area (not full A4 width)
export const CARD_WIDTH_MM = CONTENT_WIDTH_MM;

/**
 * Calculate card height based on cards per page
 * For 20 cards: 2 columns × 10 rows
 */
export const getCardHeight = (cardsPerPage: CardsPerPageOption): number => {
  if (cardsPerPage === 20) {
    return CONTENT_HEIGHT_MM / 10;
  }
  return CONTENT_HEIGHT_MM / 4;
};

// Default card heights for each layout (within vertical margins)
export const CARD_HEIGHT_4_MM = CONTENT_HEIGHT_MM / 4;
export const CARD_HEIGHT_20_MM = CONTENT_HEIGHT_MM / 10;

// Card width (full page width for 4 cards, half for 20 cards)
export const getCardWidth = (cardsPerPage: CardsPerPageOption): number => {
  if (cardsPerPage === 20) {
    return CARD_WIDTH_MM / 2;
  }
  return CARD_WIDTH_MM;
};

/**
 * Get half width based on cards per page (for each image section within a card)
 */
export const getHalfWidth = (cardsPerPage: CardsPerPageOption): number => {
  return getCardWidth(cardsPerPage) / 2;
};

/**
 * Get half height based on cards per page
 */
export const getHalfHeight = (cardsPerPage: CardsPerPageOption): number => {
  return getCardHeight(cardsPerPage);
};

/**
 * CSS aspect-ratio of a hanging portrait face (width / height).
 */
export const getHangingPortraitAspect = (cardsPerPage: CardsPerPageOption): number => {
  return getCardHeight(cardsPerPage) / getHalfWidth(cardsPerPage);
};

// Fold line settings
export const FOLD_LINE_WIDTH_MM = 0.3;
export const FOLD_LINE_DASH_MM = 3;

// Accepted image formats
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ACCEPTED_IMAGE_EXTENSIONS = '.jpg,.jpeg,.png,.webp';

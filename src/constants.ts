/**
 * Card and PDF dimension constants
 * All measurements in millimeters unless otherwise noted
 */

// A4 page dimensions
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

// Layout options
export type CardsPerPageOption = 4 | 5 | 20;

// Cut line width (white lines between cards for cutting guide)
export const CUT_LINE_WIDTH_MM = 0.5;

// No margins - cards fill entire page
export const PAGE_MARGIN_Y_MM = 0;
export const PAGE_MARGIN_X_MM = 0;

// Card width is always full page width
export const CARD_WIDTH_MM = A4_WIDTH_MM; // 210mm

/**
 * Calculate card height based on cards per page
 * For 20 cards: 2 columns × 10 rows, each card is half size of 5-card layout
 */
export const getCardHeight = (cardsPerPage: CardsPerPageOption): number => {
  if (cardsPerPage === 20) {
    return A4_HEIGHT_MM / 5 / 2; // Half the height of 5-card layout (same size, just more per page)
  }
  return A4_HEIGHT_MM / cardsPerPage;
};

// Default card heights for each layout
export const CARD_HEIGHT_5_MM = A4_HEIGHT_MM / 5; // 59.4mm
export const CARD_HEIGHT_4_MM = A4_HEIGHT_MM / 4; // 74.25mm
export const CARD_HEIGHT_20_MM = CARD_HEIGHT_5_MM / 2; // 29.7mm (half of 5-card)

// Card width (full page width for 4/5 cards, half for 20 cards)
export const getCardWidth = (cardsPerPage: CardsPerPageOption): number => {
  if (cardsPerPage === 20) {
    return CARD_WIDTH_MM / 2; // Half width for 20-card layout (2 columns)
  }
  return CARD_WIDTH_MM;
};

// Half card width (each image section - left and right halves)
export const HALF_WIDTH_MM = CARD_WIDTH_MM / 2; // 105mm

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

// Card aspect ratio for CSS (using 5 cards as default for preview)
export const CARD_ASPECT_RATIO_5 = CARD_WIDTH_MM / CARD_HEIGHT_5_MM;
export const CARD_ASPECT_RATIO_4 = CARD_WIDTH_MM / CARD_HEIGHT_4_MM;

// Preview card dimensions in pixels (for screen display)
export const PREVIEW_CARD_WIDTH_PX = 340;
export const PREVIEW_CARD_HEIGHT_5_PX = Math.round(
  PREVIEW_CARD_WIDTH_PX / CARD_ASPECT_RATIO_5
);
export const PREVIEW_CARD_HEIGHT_4_PX = Math.round(
  PREVIEW_CARD_WIDTH_PX / CARD_ASPECT_RATIO_4
);

// Border width in mm for PDF and pixels for preview
export const BORDER_WIDTH_MM = 1.0;
export const BORDER_WIDTH_PX = 2;

// Fold line settings
export const FOLD_LINE_WIDTH_MM = 0.3;
export const FOLD_LINE_DASH_MM = 3;

// Accepted image formats
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ACCEPTED_IMAGE_EXTENSIONS = '.jpg,.jpeg,.png,.webp';

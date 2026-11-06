/**
 * Card and PDF dimension constants
 * All measurements in millimeters unless otherwise noted
 */

// A4 page dimensions
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

// Layout options: 4 initiative cards or pawn sheet
export type CardsPerPageOption = 4 | 20;

export const isPawnLayout = (cardsPerPage: CardsPerPageOption): boolean =>
  cardsPerPage === 20;

/** Pawns: stacked A / fold / B, 8 columns × 2 rows */
export const PAWN_COLUMNS = 8;
export const PAWN_ROWS = 2;

/** Cut-out stand is one third of the standing pawn (face + stand). */
export const PAWN_BASE_FRACTION_OF_PAWN = 1 / 3;

export const PAWN_BASE_TO_FACE_RATIO =
  PAWN_BASE_FRACTION_OF_PAWN / (1 - PAWN_BASE_FRACTION_OF_PAWN);

export const PAWNS_PER_PAGE = PAWN_COLUMNS * PAWN_ROWS;

export const getItemsPerPage = (cardsPerPage: CardsPerPageOption): number =>
  isPawnLayout(cardsPerPage) ? PAWNS_PER_PAGE : 4;

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

export const getLayoutColumns = (cardsPerPage: CardsPerPageOption): number =>
  isPawnLayout(cardsPerPage) ? PAWN_COLUMNS : 1;

export const getLayoutRows = (cardsPerPage: CardsPerPageOption): number =>
  isPawnLayout(cardsPerPage) ? PAWN_ROWS : 4;

/**
 * Full cell height on the sheet (initiative: hanging strip; pawns: two stacked sides).
 */
export const getCardHeight = (cardsPerPage: CardsPerPageOption): number => {
  return CONTENT_HEIGHT_MM / getLayoutRows(cardsPerPage);
};

// Default card heights for each layout (within vertical margins)
export const CARD_HEIGHT_4_MM = CONTENT_HEIGHT_MM / 4;
export const CARD_HEIGHT_20_MM = CONTENT_HEIGHT_MM / PAWN_ROWS;

export const getCardWidth = (cardsPerPage: CardsPerPageOption): number => {
  return CONTENT_WIDTH_MM / getLayoutColumns(cardsPerPage);
};

/**
 * Width of one illustrated face.
 * Initiative cards place two faces side by side; pawns use the full cell width.
 */
export const getHalfWidth = (cardsPerPage: CardsPerPageOption): number => {
  if (isPawnLayout(cardsPerPage)) {
    return getCardWidth(cardsPerPage);
  }
  return getCardWidth(cardsPerPage) / 2;
};

/**
 * Gap between the two illustrated halves of an initiative card, centered on
 * the fold line: each half bleeds half of this gap away from the card center.
 */
export const INITIATIVE_HALF_GAP_MM = 1;

/**
 * Height of the illustrated face. Pawns reserve extra height for a cut tab
 * on each stacked side (A above the fold, B below).
 */
export const getFaceHeight = (cardsPerPage: CardsPerPageOption): number => {
  if (isPawnLayout(cardsPerPage)) {
    return getCardHeight(cardsPerPage) / 2 / (1 + PAWN_BASE_TO_FACE_RATIO);
  }
  return getCardHeight(cardsPerPage);
};

export const getBaseHeight = (cardsPerPage: CardsPerPageOption): number => {
  if (isPawnLayout(cardsPerPage)) {
    return getFaceHeight(cardsPerPage) * PAWN_BASE_TO_FACE_RATIO;
  }
  return 0;
};

/**
 * Print height of one illustrated half (same as face height).
 */
export const getHalfHeight = (cardsPerPage: CardsPerPageOption): number => {
  return getFaceHeight(cardsPerPage);
};

/**
 * CSS aspect-ratio of one illustrated face as it appears in use (width / height).
 */
export const getHangingPortraitAspect = (cardsPerPage: CardsPerPageOption): number => {
  if (isPawnLayout(cardsPerPage)) {
    return getHalfWidth(cardsPerPage) / getFaceHeight(cardsPerPage);
  }
  return getCardHeight(cardsPerPage) / getHalfWidth(cardsPerPage);
};

/**
 * CSS aspect-ratio of one sheet side, including the pawn cut tab.
 */
export const getSheetSideAspect = (cardsPerPage: CardsPerPageOption): number => {
  if (isPawnLayout(cardsPerPage)) {
    return getHalfWidth(cardsPerPage) / (getFaceHeight(cardsPerPage) + getBaseHeight(cardsPerPage));
  }
  return getHangingPortraitAspect(cardsPerPage);
};

// Fold line settings
export const FOLD_LINE_WIDTH_MM = 0.3;
export const FOLD_LINE_DASH_MM = 3;

/** Fold marks stop short of the printed area's ends by this much. */
export const FOLD_LINE_INSET_MM = 0.5;

/** Pawn base-tab fold dash stops short of the tab's sides by this much. */
export const PAWN_BASE_DASH_INSET_MM = 0.4;

/** Stroke width of the pawn base tab cut outline. */
export const PAWN_BASE_OUTLINE_WIDTH_MM = 0.25;

/**
 * Raster density when rendering a printed half to canvas (px per mm, ~254 dpi).
 * Keeps PDF size sane without visible print softness.
 */
export const PRINT_PX_PER_MM = 10;

// Accepted image formats
export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];
export const ACCEPTED_IMAGE_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.heic,.heif';

/** Ignore click if pointer moved more than this (card reorder / cover pan). */
export const POINTER_DRAG_THRESHOLD_PX = 6;

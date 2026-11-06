/**
 * Card and PDF dimension constants
 * All measurements in millimeters unless otherwise noted
 */

import type { ObjectTheme } from './types';

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

// --- Object cards (physical item cards: shirt + description pairs) ---------

/** Sheet grid for object faces. */
export const OBJECT_COLUMNS = 3;
export const OBJECT_ROWS = 3;

/** Faces printed per object: shirt first, then its description (row-major cells). */
export const OBJECT_FACES_PER_OBJECT = 2;

/** Whole objects that fit on one sheet (the odd 9th cell stays empty). */
export const OBJECTS_PER_PAGE = Math.floor(
  (OBJECT_COLUMNS * OBJECT_ROWS) / OBJECT_FACES_PER_OBJECT
);

export const getGameObjectCellWidth = (): number => CONTENT_WIDTH_MM / OBJECT_COLUMNS;
export const getGameObjectCellHeight = (): number => CONTENT_HEIGHT_MM / OBJECT_ROWS;

/** Rounded-corner radius of the printed card, as a fraction of the cell width. */
export const OBJECT_CORNER_RADIUS_FRACTION = 0.05;

// Shirt zones, as fractions of the face cell. The name band sits on the colored
// card background; the image window and the slogan scroll are paper insets.
export const OBJECT_SHIRT_NAME_FRACTION = 0.12;
export const OBJECT_SHIRT_SCROLL_FRACTION = 0.16;
export const OBJECT_SHIRT_GAP_FRACTION = 0.015;
export const OBJECT_SHIRT_SIDE_INSET_FRACTION = 0.06;
export const OBJECT_SHIRT_SCROLL_SIDE_INSET_FRACTION = 0.09;
/** Badge diameter and its inset from the face's top-right corner, of cell width. */
export const OBJECT_BADGE_DIAMETER_FRACTION = 0.18;
export const OBJECT_BADGE_INSET_FRACTION = 0.045;

// Description zones. Name plate and framed text box are paper on the card bg;
// «Описание» label sits on the background between them.
export const OBJECT_DESC_NAME_FRACTION = 0.125;
export const OBJECT_DESC_LABEL_FRACTION = 0.045;
export const OBJECT_DESC_SIDE_INSET_FRACTION = 0.06;
/** Gap between the frame's outer edge and the text it contains. */
export const OBJECT_DESC_TEXT_PADDING_FRACTION = 0.05;

// Print type sizes in millimeters (screen scales from the same ratios).
export const OBJECT_NAME_FONT_MM = 4.3;
export const OBJECT_TEXT_FONT_MM = 3.1;
export const OBJECT_SLOGAN_FONT_MM = 2.7;
export const OBJECT_LABEL_FONT_MM = 2.3;
export const OBJECT_BADGE_FONT_MM = 3.6;

/** Leading for wrapped object text (× font size). */
export const OBJECT_LINE_HEIGHT_FACTOR = 1.3;
/** Body text may shrink this far below the base size before overflow is reported. */
export const OBJECT_MIN_FONT_FRACTION = 0.55;

/**
 * Object card palettes — the single source of truth for object colors.
 * The screen reads these into CSS custom properties; the PDF strokes/fills
 * the same values.
 */
export interface ObjectPalette {
  /** Card background (shirt name band, description label sit on it). */
  cardBg: string;
  /** Paper fill: image window, name plate, description frame, scroll body. */
  paper: string;
  /** Text drawn on `paper`. */
  ink: string;
  /** Text drawn on `cardBg` (shirt name, «Описание»). */
  onCardBg: string;
  /** Quantity badge circle and scroll rollers. */
  accent: string;
  /** Border of the description text frame. */
  frame: string;
}

export const OBJECT_PALETTES: Record<ObjectTheme, ObjectPalette> = {
  ruby: {
    cardBg: '#8f1212',
    paper: '#f7ecd2',
    ink: '#1f1f1f',
    onCardBg: '#fff5e6',
    accent: '#f2b13c',
    frame: '#5d0a0a',
  },
  emerald: {
    cardBg: '#0e4d2b',
    paper: '#f4f1e4',
    ink: '#1a1a1a',
    onCardBg: '#eafaea',
    accent: '#57b06b',
    frame: '#08341b',
  },
  obsidian: {
    cardBg: '#1c1e24',
    paper: '#e9e9ef',
    ink: '#15161a',
    onCardBg: '#e3e5ee',
    accent: '#8d96a8',
    frame: '#000000',
  },
};

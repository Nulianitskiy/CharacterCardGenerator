/**
 * Pure sheet-placement math, in millimeters, with no jsPDF or DOM access.
 *
 * `pdfGenerator.ts` strokes whatever these functions return, so the placement
 * of faces, folds, base tabs and cut guides is testable in a plain Node
 * environment (same pattern as `pawnLayout.ts`).
 */

import {
  FOLD_LINE_INSET_MM,
  INITIATIVE_HALF_GAP_MM,
  PAWN_BASE_DASH_INSET_MM,
  PAGE_MARGIN_X_MM,
  PAGE_MARGIN_Y_MM,
  getBaseHeight,
  getCardHeight,
  getCardWidth,
  getFaceHeight,
  getHalfWidth,
  getLayoutColumns,
  type CardsPerPageOption,
} from '../constants';

export interface RectMm {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SegmentMm {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Rotation (degrees) applied to the upright portrait raster so it hangs
 * correctly on the GM screen once the card is folded along the centerline.
 * Side A and side B lean to opposite halves of the fold.
 */
export const INITIATIVE_SIDE_A_ROTATION_DEG = -90;
export const INITIATIVE_SIDE_B_ROTATION_DEG = 90;

// --- Initiative sheet -------------------------------------------------------

export interface InitiativeSlot {
  /** Full cell of the hanging card (both halves plus margins between them). */
  cell: RectMm;
  /** Right half as placed on the sheet (already rotated raster goes here). */
  sideA: RectMm;
  /** Left half as placed on the sheet. */
  sideB: RectMm;
  /** Vertical fold along the card centerline, inset from the cell's ends. */
  fold: SegmentMm;
}

/**
 * Placement of one initiative card at `positionOnPage` (0 = top).
 * The two halves bleed half a gap outward from the cell so the fold stays
 * exactly on the card's centerline.
 */
export const initiativeSlot = (
  positionOnPage: number,
  cardsPerPage: CardsPerPageOption
): InitiativeSlot => {
  const cellWidth = getCardWidth(cardsPerPage);
  const cellHeight = getCardHeight(cardsPerPage);
  const halfWidth = getHalfWidth(cardsPerPage);
  const x = PAGE_MARGIN_X_MM;
  const y = PAGE_MARGIN_Y_MM + positionOnPage * cellHeight;
  const foldX = x + halfWidth;

  return {
    cell: { x, y, width: cellWidth, height: cellHeight },
    sideB: { x: x - INITIATIVE_HALF_GAP_MM / 2, y, width: halfWidth, height: cellHeight },
    sideA: { x: foldX + INITIATIVE_HALF_GAP_MM / 2, y, width: halfWidth, height: cellHeight },
    fold: {
      x1: foldX,
      y1: y + FOLD_LINE_INSET_MM,
      x2: foldX,
      y2: y + cellHeight - FOLD_LINE_INSET_MM,
    },
  };
};

// --- Cut guide lines --------------------------------------------------------

export interface SheetGridSpec {
  columns: number;
  cellWidthMm: number;
  cellHeightMm: number;
  originX: number;
  originY: number;
}

export const sheetGridSpec = (cardsPerPage: CardsPerPageOption): SheetGridSpec => ({
  columns: getLayoutColumns(cardsPerPage),
  cellWidthMm: getCardWidth(cardsPerPage),
  cellHeightMm: getCardHeight(cardsPerPage),
  originX: PAGE_MARGIN_X_MM,
  originY: PAGE_MARGIN_Y_MM,
});

/**
 * Cut guides between `cardsOnPage` cells packed column-first into a grid of
 * `spec.columns` columns. The last, partially filled column is one cell
 * shorter, so inner borders must stop at the taller neighbor's extent.
 *
 * With a single column the grid's outer border is the page margin — only the
 * horizontal separators between cards are drawn.
 */
export const gridCutSegments = (cardsOnPage: number, spec: SheetGridSpec): SegmentMm[] => {
  const segments: SegmentMm[] = [];
  const { columns, cellWidthMm, cellHeightMm, originX, originY } = spec;
  const contentRight = originX + cellWidthMm;

  if (columns <= 1) {
    for (let i = 1; i < cardsOnPage; i++) {
      const y = originY + i * cellHeightMm;
      segments.push({ x1: originX, y1: y, x2: contentRight, y2: y });
    }
    return segments;
  }

  const rowsOnPage = Math.ceil(cardsOnPage / columns);
  const lastRowCount = cardsOnPage % columns === 0 ? columns : cardsOnPage % columns;

  const rowsInColumn = (col: number): number => {
    if (col < 0 || col >= columns) return 0;
    return col < lastRowCount ? rowsOnPage : rowsOnPage - 1;
  };

  const colsInRow = (row: number): number => {
    if (row < 0 || row >= rowsOnPage) return 0;
    return row === rowsOnPage - 1 ? lastRowCount : columns;
  };

  for (let c = 0; c <= columns; c++) {
    const rows = Math.max(rowsInColumn(c - 1), rowsInColumn(c));
    if (rows <= 0) continue;
    const x = originX + c * cellWidthMm;
    segments.push({ x1: x, y1: originY, x2: x, y2: originY + rows * cellHeightMm });
  }

  for (let r = 1; r < rowsOnPage; r++) {
    const cols = Math.max(colsInRow(r - 1), colsInRow(r));
    const y = originY + r * cellHeightMm;
    segments.push({ x1: originX, y1: y, x2: originX + cols * cellWidthMm, y2: y });
  }

  return segments;
};

// --- Pawn sheet -------------------------------------------------------------

export interface PawnSideGeometry {
  /** Cut-out stand tab (drawn as a rect with a fold dash on its face seam). */
  base: RectMm;
  /** Illustrated face of this side. */
  face: RectMm;
  /** Fold between the tab and the face, inset from the sides. */
  tabFold: SegmentMm;
}

export interface PawnSlotGeometry {
  /** Full cell outline for the cut guide (one per placement). */
  cell: RectMm;
  /** Bottom side: tab at the cell's top edge, face below it. */
  sideA: PawnSideGeometry;
  /** Top side (prints upside-down): face below the fold, tab at the bottom. */
  sideB: PawnSideGeometry;
  /** Horizontal fold between the two faces, inset from the sides. */
  middleFold: SegmentMm;
}

const tabFoldSegment = (x: number, y: number, width: number): SegmentMm => ({
  x1: x + PAWN_BASE_DASH_INSET_MM,
  y1: y,
  x2: x + width - PAWN_BASE_DASH_INSET_MM,
  y2: y,
});

/**
 * Placement of one pawn at grid cell (col, row) spanning colSpan × rowSpan
 * cells (see `getPawnCellSpan`). Each side stacks a base tab and a face;
 * the sheet folds in three places: two tab seams and the middle fold.
 */
export const pawnSlotGeometry = (
  col: number,
  row: number,
  colSpan: number,
  rowSpan: number,
  cardsPerPage: CardsPerPageOption
): PawnSlotGeometry => {
  const cellWidth = getCardWidth(cardsPerPage);
  const cellHeight = getCardHeight(cardsPerPage);
  const x = PAGE_MARGIN_X_MM + col * cellWidth;
  const y = PAGE_MARGIN_Y_MM + row * cellHeight;

  const faceWidth = getHalfWidth(cardsPerPage) * colSpan;
  const faceHeight = getFaceHeight(cardsPerPage) * rowSpan;
  const baseHeight = getBaseHeight(cardsPerPage) * rowSpan;
  const sideHeight = faceHeight + baseHeight;
  const foldY = y + sideHeight;

  return {
    cell: { x, y, width: colSpan * cellWidth, height: rowSpan * cellHeight },
    sideA: {
      base: { x, y, width: faceWidth, height: baseHeight },
      face: { x, y: y + baseHeight, width: faceWidth, height: faceHeight },
      tabFold: tabFoldSegment(x, y + baseHeight, faceWidth),
    },
    sideB: {
      face: { x, y: foldY, width: faceWidth, height: faceHeight },
      base: { x, y: foldY + faceHeight, width: faceWidth, height: baseHeight },
      tabFold: tabFoldSegment(x, foldY + faceHeight, faceWidth),
    },
    middleFold: {
      x1: x + FOLD_LINE_INSET_MM,
      y1: foldY,
      x2: x + faceWidth - FOLD_LINE_INSET_MM,
      y2: foldY,
    },
  };
};

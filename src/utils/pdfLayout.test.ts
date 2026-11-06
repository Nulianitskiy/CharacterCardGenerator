import { describe, expect, it } from 'vitest';
import {
  CONTENT_HEIGHT_MM,
  CONTENT_WIDTH_MM,
  PAGE_MARGIN_X_MM,
  PAGE_MARGIN_Y_MM,
  getCardHeight,
  getCardWidth,
  getFaceHeight,
  getBaseHeight,
  getHalfWidth,
} from '../constants';
import {
  INITIATIVE_SIDE_A_ROTATION_DEG,
  INITIATIVE_SIDE_B_ROTATION_DEG,
  gridCutSegments,
  initiativeSlot,
  pawnSlotGeometry,
  sheetGridSpec,
  type SheetGridSpec,
} from './pdfLayout';

const GRID: SheetGridSpec = {
  columns: 3,
  cellWidthMm: 10,
  cellHeightMm: 20,
  originX: 5,
  originY: 5,
};

describe('initiativeSlot', () => {
  const cardHeight = getCardHeight(4); // 71.75
  const halfWidth = getHalfWidth(4); // 100

  it('stacks cells from the top margin down, filling the content column', () => {
    for (let position = 0; position < 4; position++) {
      const { cell } = initiativeSlot(position, 4);
      expect(cell).toEqual({
        x: PAGE_MARGIN_X_MM,
        y: PAGE_MARGIN_Y_MM + position * cardHeight,
        width: CONTENT_WIDTH_MM,
        height: cardHeight,
      });
    }
    const last = initiativeSlot(3, 4).cell;
    expect(last.y + last.height).toBe(PAGE_MARGIN_Y_MM + CONTENT_HEIGHT_MM);
  });

  it('bleeds each half outward by half the gap so the fold sits on the centerline', () => {
    const { cell, sideA, sideB, fold } = initiativeSlot(0, 4);
    const centerX = cell.x + halfWidth;

    expect(fold.x1).toBe(centerX);
    expect(fold.x2).toBe(centerX);
    // The two rasters never overlap; the 1 mm gap is centered on the fold.
    expect(sideB.x + sideB.width).toBe(centerX - 0.5);
    expect(sideA.x).toBe(centerX + 0.5);
    // The bleed past the page margin is symmetric on both sides.
    expect(sideB.x).toBe(PAGE_MARGIN_X_MM - 0.5);
    expect(sideA.x + sideA.width).toBe(PAGE_MARGIN_X_MM + CONTENT_WIDTH_MM + 0.5);
  });

  it('insets the fold mark from the cell edges', () => {
    const { fold } = initiativeSlot(1, 4);
    const y = PAGE_MARGIN_Y_MM + getCardHeight(4);
    expect(fold.y1).toBe(y + 0.5);
    expect(fold.y2).toBe(y + getCardHeight(4) - 0.5);
  });

  it('rotates the two halves in opposite directions', () => {
    expect(INITIATIVE_SIDE_A_ROTATION_DEG).toBe(-90);
    expect(INITIATIVE_SIDE_B_ROTATION_DEG).toBe(90);
  });
});

describe('gridCutSegments', () => {
  it('single column draws only the separators between cards', () => {
    const spec = sheetGridSpec(4);
    const segments = gridCutSegments(4, spec);

    expect(segments).toHaveLength(3);
    for (const segment of segments) {
      expect(segment.x1).toBe(PAGE_MARGIN_X_MM);
      expect(segment.x2).toBe(PAGE_MARGIN_X_MM + CONTENT_WIDTH_MM);
      expect(segment.y1).toBe(segment.y2);
    }
    expect(segments.map((s) => s.y1)).toEqual([
      PAGE_MARGIN_Y_MM + getCardHeight(4),
      PAGE_MARGIN_Y_MM + 2 * getCardHeight(4),
      PAGE_MARGIN_Y_MM + 3 * getCardHeight(4),
    ]);
  });

  it('a full multi-column grid gets every inner border', () => {
    const segments = gridCutSegments(9, GRID);
    // 4 vertical borders, 2 inner horizontal borders, no page-edge lines.
    expect(segments).toHaveLength(6);
    const verticals = segments.filter((s) => s.x1 === s.x2);
    const horizontals = segments.filter((s) => s.y1 === s.y2);
    expect(verticals).toHaveLength(4);
    expect(horizontals).toHaveLength(2);
    for (const v of verticals) expect(v.y2 - v.y1).toBe(3 * GRID.cellHeightMm);
    for (const h of horizontals) expect(h.x2 - h.x1).toBe(3 * GRID.cellWidthMm);
  });

  it('shortens borders next to the partially filled last column', () => {
    // 7 cells in 3 columns -> rows of 3, 3, 1: the last column is one row shorter.
    const segments = gridCutSegments(7, GRID);
    const verticals = segments.filter((s) => s.x1 === s.x2);
    expect(verticals).toHaveLength(4);
    expect(verticals[0].y2 - verticals[0].y1).toBe(3 * GRID.cellHeightMm); // col 0/1 taller
    expect(verticals[1].y2 - verticals[1].y1).toBe(3 * GRID.cellHeightMm);
    expect(verticals[2].y2 - verticals[2].y1).toBe(2 * GRID.cellHeightMm); // col 2/3 shorter
    expect(verticals[3].y2 - verticals[3].y1).toBe(2 * GRID.cellHeightMm);
    // Inner horizontals span the full grid width because rows 0-1 are full.
    const horizontals = segments.filter((s) => s.y1 === s.y2);
    expect(horizontals).toHaveLength(2);
    for (const h of horizontals) expect(h.x2 - h.x1).toBe(3 * GRID.cellWidthMm);
  });

  it('draws nothing when there is nothing to separate', () => {
    expect(gridCutSegments(0, GRID)).toEqual([]);
    expect(gridCutSegments(1, GRID).every((s) => s.x1 === s.x2)).toBe(true);
    expect(gridCutSegments(3, GRID).every((s) => s.x1 === s.x2)).toBe(true);
    expect(gridCutSegments(0, sheetGridSpec(4))).toEqual([]);
    expect(gridCutSegments(1, sheetGridSpec(4))).toEqual([]);
  });
});

describe('pawnSlotGeometry', () => {
  const cellWidth = getCardWidth(20); // 25
  const cellHeight = getCardHeight(20); // 143.5
  const faceHeight = getFaceHeight(20);
  const baseHeight = getBaseHeight(20);

  it('stacks tab / face / face / tab inside the cell', () => {
    const { cell, sideA, sideB, middleFold } = pawnSlotGeometry(0, 0, 1, 1, 20);

    expect(cell).toEqual({ x: PAGE_MARGIN_X_MM, y: PAGE_MARGIN_Y_MM, width: cellWidth, height: cellHeight });
    expect(sideA.base.x).toBe(cell.x);
    expect(sideA.base.y).toBe(cell.y);
    expect(sideA.face.y).toBeCloseTo(cell.y + baseHeight, 10);
    expect(middleFold.y1).toBeCloseTo(cell.y + faceHeight + baseHeight, 10);
    // middle fold is exactly halfway through the cell
    expect(middleFold.y1).toBeCloseTo(cell.y + cellHeight / 2, 10);
    expect(sideB.face.y).toBeCloseTo(middleFold.y1, 10);
    expect(sideB.base.y).toBeCloseTo(cell.y + cellHeight - baseHeight, 10);
    expect(sideB.base.y + sideB.base.height).toBeCloseTo(cell.y + cellHeight, 10);
  });

  it('offsets slots by their grid cell', () => {
    const { cell } = pawnSlotGeometry(3, 1, 1, 1, 20);
    expect(cell.x).toBe(PAGE_MARGIN_X_MM + 3 * cellWidth);
    expect(cell.y).toBeCloseTo(PAGE_MARGIN_Y_MM + cellHeight, 10);
  });

  it('scales spans: large is 2x1, huge is 2x2', () => {
    const large = pawnSlotGeometry(2, 0, 2, 1, 20);
    expect(large.cell.width).toBe(2 * cellWidth);
    expect(large.sideA.face.width).toBe(2 * cellWidth);
    expect(large.sideA.face.height).toBeCloseTo(faceHeight, 10);

    const huge = pawnSlotGeometry(0, 0, 2, 2, 20);
    expect(huge.cell).toEqual({
      x: PAGE_MARGIN_X_MM,
      y: PAGE_MARGIN_Y_MM,
      width: 2 * cellWidth,
      height: 2 * cellHeight,
    });
    expect(huge.sideA.face.height).toBeCloseTo(2 * faceHeight, 10);
    expect(huge.sideB.base.y + huge.sideB.base.height).toBeCloseTo(
      PAGE_MARGIN_Y_MM + CONTENT_HEIGHT_MM,
      10
    );
  });

  it('insets fold dashes: tab seams tighter than the middle fold', () => {
    const { sideA, sideB, middleFold } = pawnSlotGeometry(0, 0, 1, 1, 20);

    expect(sideA.tabFold.x1).toBe(PAGE_MARGIN_X_MM + 0.4);
    expect(sideA.tabFold.x2).toBe(PAGE_MARGIN_X_MM + cellWidth - 0.4);
    expect(sideA.tabFold.y1).toBeCloseTo(sideA.face.y, 10);
    expect(sideB.tabFold.y1).toBeCloseTo(sideB.base.y, 10);

    expect(middleFold.x1).toBe(PAGE_MARGIN_X_MM + 0.5);
    expect(middleFold.x2).toBe(PAGE_MARGIN_X_MM + cellWidth - 0.5);
  });
});

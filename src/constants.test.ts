import { describe, expect, it } from 'vitest';
import {
  CARD_WIDTH_MM,
  CONTENT_HEIGHT_MM,
  CONTENT_WIDTH_MM,
  PAWN_BASE_FRACTION_OF_PAWN,
  PAWN_BASE_TO_FACE_RATIO,
  PAWN_COLUMNS,
  PAWN_ROWS,
  PAWNS_PER_PAGE,
  getBaseHeight,
  getCardHeight,
  getCardWidth,
  getFaceHeight,
  getHalfHeight,
  getHalfWidth,
  getHangingPortraitAspect,
  getItemsPerPage,
  getSheetSideAspect,
} from './constants';

describe('card geometry', () => {
  it('fits four cards into the printable height', () => {
    expect(getCardHeight(4) * 4).toBeCloseTo(CONTENT_HEIGHT_MM);
    expect(getCardWidth(4)).toBe(CARD_WIDTH_MM);
    expect(getHalfWidth(4)).toBe(CARD_WIDTH_MM / 2);
    expect(getHalfHeight(4)).toBe(getCardHeight(4));
    expect(getFaceHeight(4)).toBe(getCardHeight(4));
    expect(getBaseHeight(4)).toBe(0);
    expect(getHangingPortraitAspect(4)).toBeCloseTo(getCardHeight(4) / getHalfWidth(4));
    expect(getSheetSideAspect(4)).toBe(getHangingPortraitAspect(4));
  });

  it('fits an 8×2 stacked pawn grid with a stand one third of the pawn', () => {
    expect(PAWNS_PER_PAGE).toBe(PAWN_COLUMNS * PAWN_ROWS);
    expect(getItemsPerPage(20)).toBe(PAWNS_PER_PAGE);
    expect(getItemsPerPage(4)).toBe(4);
    expect(getCardHeight(20) * PAWN_ROWS).toBeCloseTo(CONTENT_HEIGHT_MM);
    expect(getCardWidth(20) * PAWN_COLUMNS).toBeCloseTo(CONTENT_WIDTH_MM);
    expect(getHalfWidth(20)).toBeCloseTo(CONTENT_WIDTH_MM / PAWN_COLUMNS);
    expect(getFaceHeight(20) + getBaseHeight(20)).toBeCloseTo(getCardHeight(20) / 2);
    expect(getBaseHeight(20)).toBeCloseTo(getFaceHeight(20) * PAWN_BASE_TO_FACE_RATIO);
    expect(getBaseHeight(20)).toBeCloseTo(
      (getFaceHeight(20) + getBaseHeight(20)) * PAWN_BASE_FRACTION_OF_PAWN
    );
    expect(getHalfHeight(20)).toBe(getFaceHeight(20));
    expect(getHangingPortraitAspect(20)).toBeCloseTo(
      getHalfWidth(20) / getFaceHeight(20)
    );
    expect(getSheetSideAspect(20)).toBeCloseTo(
      getHalfWidth(20) / (getFaceHeight(20) + getBaseHeight(20))
    );
  });
});

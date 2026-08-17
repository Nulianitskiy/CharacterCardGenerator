import { describe, expect, it } from 'vitest';
import {
  CARD_WIDTH_MM,
  CONTENT_HEIGHT_MM,
  CONTENT_WIDTH_MM,
  getCardHeight,
  getCardWidth,
  getHalfHeight,
  getHalfWidth,
} from './constants';

describe('card geometry', () => {
  it('fits four cards into the printable height', () => {
    expect(getCardHeight(4) * 4).toBeCloseTo(CONTENT_HEIGHT_MM);
    expect(getCardWidth(4)).toBe(CARD_WIDTH_MM);
    expect(getHalfWidth(4)).toBe(CARD_WIDTH_MM / 2);
    expect(getHalfHeight(4)).toBe(getCardHeight(4));
  });

  it('fits a 2×10 grid into the printable area', () => {
    expect(getCardHeight(20) * 10).toBeCloseTo(CONTENT_HEIGHT_MM);
    expect(getCardWidth(20) * 2).toBeCloseTo(CONTENT_WIDTH_MM);
    expect(getHalfWidth(20)).toBeCloseTo(CONTENT_WIDTH_MM / 4);
  });
});

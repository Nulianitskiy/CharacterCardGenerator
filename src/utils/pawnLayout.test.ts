import { describe, expect, it } from 'vitest';
import type { CharacterCard } from '../types';
import { DEFAULT_PAWN_SIZE, defaultNameSettings } from '../types';
import {
  getPawnCellSpan,
  packPawnSheet,
  pawnPageCount,
  resolvePawnSize,
} from './pawnLayout';

const pawn = (id: string, size: CharacterCard['pawnSize'] = 'medium'): CharacterCard =>
  ({
    id,
    file: new File([], `${id}.jpg`),
    imageUrl: `blob:${id}`,
    nameSettings: { ...defaultNameSettings },
    pawnSize: size,
  }) as CharacterCard;

describe('pawn size', () => {
  it('maps medium, large and huge onto the sheet grid', () => {
    expect(resolvePawnSize({})).toBe(DEFAULT_PAWN_SIZE);
    expect(getPawnCellSpan('medium')).toEqual({ cols: 1, rows: 1 });
    expect(getPawnCellSpan('large')).toEqual({ cols: 2, rows: 1 });
    expect(getPawnCellSpan('huge')).toEqual({ cols: 2, rows: 2 });
  });
});

describe('packPawnSheet', () => {
  it('fits sixteen medium pawns on one page', () => {
    const cards = Array.from({ length: 16 }, (_, i) => pawn(`m${i}`));
    const packed = packPawnSheet(cards);
    expect(packed).toHaveLength(16);
    expect(pawnPageCount(cards)).toBe(1);
    expect(packed[8]).toMatchObject({ page: 0, col: 0, row: 1 });
  });

  it('fits eight large pawns on one page', () => {
    const cards = Array.from({ length: 8 }, (_, i) => pawn(`L${i}`, 'large'));
    const packed = packPawnSheet(cards);
    expect(packed.map((item) => ({ col: item.col, row: item.row, page: item.page }))).toEqual([
      { col: 0, row: 0, page: 0 },
      { col: 2, row: 0, page: 0 },
      { col: 4, row: 0, page: 0 },
      { col: 6, row: 0, page: 0 },
      { col: 0, row: 1, page: 0 },
      { col: 2, row: 1, page: 0 },
      { col: 4, row: 1, page: 0 },
      { col: 6, row: 1, page: 0 },
    ]);
    expect(packed.every((item) => item.colSpan === 2 && item.rowSpan === 1)).toBe(true);
    expect(pawnPageCount(cards)).toBe(1);
  });

  it('fits four huge pawns on one page', () => {
    const cards = Array.from({ length: 4 }, (_, i) => pawn(`H${i}`, 'huge'));
    const packed = packPawnSheet(cards);
    expect(packed.map((item) => ({ col: item.col, row: item.row, page: item.page }))).toEqual([
      { col: 0, row: 0, page: 0 },
      { col: 2, row: 0, page: 0 },
      { col: 4, row: 0, page: 0 },
      { col: 6, row: 0, page: 0 },
    ]);
    expect(packed.every((item) => item.colSpan === 2 && item.rowSpan === 2)).toBe(true);
    expect(pawnPageCount(cards)).toBe(1);
  });

  it('starts a new page when a huge pawn no longer fits', () => {
    const cards = [
      ...Array.from({ length: 15 }, (_, i) => pawn(`m${i}`)),
      pawn('H', 'huge'),
    ];
    const packed = packPawnSheet(cards);
    expect(packed[15]).toMatchObject({ page: 1, col: 0, row: 0, colSpan: 2, rowSpan: 2 });
    expect(pawnPageCount(cards)).toBe(2);
  });
});

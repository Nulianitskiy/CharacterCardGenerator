import { PAWN_COLUMNS, PAWN_ROWS, getBaseHeight, getFaceHeight, getHalfWidth, type CardsPerPageOption } from '../constants';
import type { CharacterCard, PawnSize } from '../types';
import { DEFAULT_PAWN_SIZE } from '../types';

export const resolvePawnSize = (card: Pick<CharacterCard, 'pawnSize'>): PawnSize =>
  card.pawnSize ?? DEFAULT_PAWN_SIZE;

export const getPawnCellSpan = (
  size: PawnSize
): { cols: number; rows: number } => {
  if (size === 'huge') return { cols: 2, rows: PAWN_ROWS };
  if (size === 'large') return { cols: 2, rows: 1 };
  return { cols: 1, rows: 1 };
};

export const getPawnPreviewAspect = (
  cardsPerPage: CardsPerPageOption,
  size: PawnSize
): number => {
  const { cols, rows } = getPawnCellSpan(size);
  const sideHeight = getFaceHeight(cardsPerPage) + getBaseHeight(cardsPerPage);
  return (getHalfWidth(cardsPerPage) * cols) / (sideHeight * rows);
};

export interface PawnPlacement {
  card: CharacterCard;
  page: number;
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
}

const emptyGrid = (): boolean[][] =>
  Array.from({ length: PAWN_ROWS }, () => Array<boolean>(PAWN_COLUMNS).fill(false));

const canPlace = (
  grid: boolean[][],
  col: number,
  row: number,
  cols: number,
  rows: number
): boolean => {
  if (col < 0 || row < 0 || col + cols > PAWN_COLUMNS || row + rows > PAWN_ROWS) {
    return false;
  }
  for (let r = row; r < row + rows; r++) {
    for (let c = col; c < col + cols; c++) {
      if (grid[r][c]) return false;
    }
  }
  return true;
};

const occupy = (
  grid: boolean[][],
  col: number,
  row: number,
  cols: number,
  rows: number
): void => {
  for (let r = row; r < row + rows; r++) {
    for (let c = col; c < col + cols; c++) {
      grid[r][c] = true;
    }
  }
};

const findSlot = (
  grid: boolean[][],
  cols: number,
  rows: number
): { col: number; row: number } | null => {
  for (let r = 0; r < PAWN_ROWS; r++) {
    for (let c = 0; c < PAWN_COLUMNS; c++) {
      if (canPlace(grid, c, r, cols, rows)) return { col: c, row: r };
    }
  }
  return null;
};

export const packPawnSheet = (cards: CharacterCard[]): PawnPlacement[] => {
  const placements: PawnPlacement[] = [];
  let page = 0;
  let grid = emptyGrid();

  for (const card of cards) {
    const { cols, rows } = getPawnCellSpan(resolvePawnSize(card));
    let slot = findSlot(grid, cols, rows);
    if (!slot) {
      page += 1;
      grid = emptyGrid();
      slot = findSlot(grid, cols, rows);
    }
    if (!slot) {
      throw new Error('Pawn does not fit on an empty sheet');
    }
    occupy(grid, slot.col, slot.row, cols, rows);
    placements.push({
      card,
      page,
      col: slot.col,
      row: slot.row,
      colSpan: cols,
      rowSpan: rows,
    });
  }

  return placements;
};

export const pawnPageCount = (cards: CharacterCard[]): number => {
  if (cards.length === 0) return 0;
  const packed = packPawnSheet(cards);
  return packed[packed.length - 1].page + 1;
};

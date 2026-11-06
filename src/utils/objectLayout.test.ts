import { describe, expect, it } from 'vitest';
import type { GameObject } from '../types';
import {
  OBJECT_COLUMNS,
  OBJECT_ROWS,
  OBJECTS_PER_PAGE,
  OBJECT_NAME_FONT_MM,
  OBJECT_TEXT_FONT_MM,
  PAGE_MARGIN_X_MM,
  PAGE_MARGIN_Y_MM,
  CONTENT_WIDTH_MM,
  CONTENT_HEIGHT_MM,
  getGameObjectCellWidth,
  getGameObjectCellHeight,
} from '../constants';
import {
  descriptionPreviewLayout,
  descriptionZones,
  fitObjectPreviewTypography,
  getObjectStatChips,
  layoutObjectStatChips,
  objectCutSegments,
  objectFaceRect,
  objectFoldSegments,
  objectPageCount,
  objectPreviewTypography,
  packObjectSheet,
  shirtPreviewLayout,
  shirtZones,
} from './objectLayout';

const cellW = getGameObjectCellWidth();
const cellH = getGameObjectCellHeight();

const obj = (id: string): GameObject =>
  ({
    id,
    name: id,
    theme: 'common',
  }) as GameObject;

describe('packObjectSheet (4×4 grid, 2 pairs per row)', () => {
  it('places every shirt and description side-by-side in the same row', () => {
    const packed = packObjectSheet([obj('a'), obj('b'), obj('c')]);

    expect(packed.map((p) => [p.object.id, p.side, p.col, p.row])).toEqual([
      ['a', 'shirt', 0, 0],
      ['a', 'description', 1, 0],
      ['b', 'shirt', 2, 0],
      ['b', 'description', 3, 0],
      ['c', 'shirt', 0, 1],
      ['c', 'description', 1, 1],
    ]);
  });

  it('fills a page with eight objects (all 16 cells, zero empty cells) and starts the ninth on a new page', () => {
    const nine = ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(obj);
    const packed = packObjectSheet(nine);
    expect(packed).toHaveLength(18);

    const pages = packed.map((p) => p.page);
    expect(pages.slice(0, 16)).toEqual(Array(16).fill(0));
    expect(pages.slice(16)).toEqual([1, 1]);
    expect(packed[16]).toMatchObject({ object: obj('9'), side: 'shirt', col: 0, row: 0, page: 1 });

    expect(OBJECTS_PER_PAGE).toBe(8);
    expect(objectPageCount(nine.slice(0, 8))).toBe(1);
    expect(objectPageCount(nine)).toBe(2);
    expect(objectPageCount([])).toBe(0);
  });

  it('uses all 16 cells on a full page with every pair sharing a row', () => {
    const full = packObjectSheet(['1', '2', '3', '4', '5', '6', '7', '8'].map(obj));
    const cells = full.map((p) => p.row * OBJECT_COLUMNS + p.col);
    expect(cells).toEqual(Array.from({ length: 16 }, (_, i) => i));

    for (let i = 0; i < full.length; i += 2) {
      expect(full[i].row).toBe(full[i + 1].row);
      expect(full[i + 1].col).toBe(full[i].col + 1);
    }
  });
});

describe('objectFaceRect', () => {
  it('maps grid cells onto the A4 content area', () => {
    expect(objectFaceRect(0, 0)).toEqual({
      x: PAGE_MARGIN_X_MM,
      y: PAGE_MARGIN_Y_MM,
      width: cellW,
      height: cellH,
    });
    const last = objectFaceRect(OBJECT_COLUMNS - 1, OBJECT_ROWS - 1);
    expect(last.x + last.width).toBeCloseTo(PAGE_MARGIN_X_MM + CONTENT_WIDTH_MM, 9);
    expect(last.y + last.height).toBeCloseTo(PAGE_MARGIN_Y_MM + CONTENT_HEIGHT_MM, 9);
  });
});

describe('objectCutSegments & objectFoldSegments', () => {
  it('draws full grid cut lines and 8 fold lines for a full page of 8 objects', () => {
    const segments = objectCutSegments(OBJECTS_PER_PAGE);
    // 5 vertical borders (cols 0..4) + 3 inner horizontals (rows 1..3) = 8 segments.
    expect(segments).toHaveLength(8);

    const verticals = segments.filter((s) => s.x1 === s.x2);
    const horizontals = segments.filter((s) => s.y1 === s.y2);
    expect(verticals).toHaveLength(5);
    expect(horizontals).toHaveLength(3);

    for (const v of verticals) {
      expect(v.y2 - v.y1).toBeCloseTo(OBJECT_ROWS * cellH, 9);
    }

    const folds = objectFoldSegments(OBJECTS_PER_PAGE);
    expect(folds).toHaveLength(8);
    expect(folds[0].x1).toBeCloseTo(PAGE_MARGIN_X_MM + cellW, 9);
    expect(folds[1].x1).toBeCloseTo(PAGE_MARGIN_X_MM + 3 * cellW, 9);
  });

  it('two objects fill the first row only; three objects span two rows with one inner horizontal', () => {
    const rowOneSegments = objectCutSegments(2);
    expect(rowOneSegments.filter((s) => s.y1 === s.y2)).toHaveLength(0);
    expect(rowOneSegments.filter((s) => s.x1 === s.x2)).toHaveLength(5);
    expect(objectFoldSegments(2)).toHaveLength(2);

    const twoRowSegments = objectCutSegments(3);
    const horizontals = twoRowSegments.filter((s) => s.y1 === s.y2);
    expect(horizontals).toHaveLength(1);
    expect(horizontals[0].x2 - horizontals[0].x1).toBeCloseTo(OBJECT_COLUMNS * cellW, 9);
  });

  it('nothing to cut or fold for zero objects', () => {
    expect(objectCutSegments(0)).toEqual([]);
    expect(objectFoldSegments(0)).toEqual([]);
  });
});

describe('shirtZones', () => {
  const face = objectFaceRect(0, 0);

  it('stacks name, image and scroll with the image absorbing the middle', () => {
    const zones = shirtZones(face, true);
    expect(zones.card).toBe(face);
    expect(zones.name.y).toBeGreaterThan(face.y);
    expect(zones.name.x).toBeCloseTo(face.x + face.width * 0.06, 9);
    expect(zones.image.y).toBeCloseTo(zones.name.y + zones.name.height + face.height * 0.015, 9);
    expect(zones.scroll).not.toBeNull();
    expect(zones.image.y + zones.image.height).toBeCloseTo(zones.scroll!.y - face.height * 0.015, 9);
    expect(zones.scroll!.x).toBeGreaterThan(zones.image.x);
    expect(zones.scroll!.y + zones.scroll!.height).toBeLessThan(face.y + face.height);
  });

  it('hides the scroll and grows the image window when there is no slogan', () => {
    const withSlogan = shirtZones(face, true);
    const without = shirtZones(face, false);

    expect(without.scroll).toBeNull();
    expect(without.image.height).toBeGreaterThan(withSlogan.image.height);
    expect(without.image.x).toBeCloseTo(withSlogan.image.x, 9);
    expect(without.image.y).toBeCloseTo(withSlogan.image.y, 9);
  });

  it('keeps all zones inside the face rect', () => {
    const zones = shirtZones(face, true);
    const rects = [zones.name, zones.image, zones.scroll!];
    for (const r of rects) {
      expect(r.x).toBeGreaterThanOrEqual(face.x);
      expect(r.y).toBeGreaterThanOrEqual(face.y);
      expect(r.x + r.width).toBeLessThanOrEqual(face.x + face.width + 1e-9);
      expect(r.y + r.height).toBeLessThanOrEqual(face.y + face.height + 1e-9);
      expect(r.width).toBeGreaterThan(0);
      expect(r.height).toBeGreaterThan(0);
    }
    expect(zones.badge.cx + zones.badge.r).toBeLessThanOrEqual(zones.window.x + zones.window.width + 1e-9);
    expect(zones.badge.cy - zones.badge.r).toBeGreaterThanOrEqual(zones.window.y - 1e-9);
    expect(zones.window.y).toBeCloseTo(zones.image.y, 9);
    expect(zones.window.y + zones.window.height).toBeCloseTo(zones.scroll!.y + zones.scroll!.height, 9);
  });
});

describe('descriptionZones & BG3 stat chips', () => {
  const face = objectFaceRect(1, 1);

  it('stacks plate, label, frame and the text rect inside', () => {
    const zones = descriptionZones(face);
    expect(zones.name.y).toBeGreaterThan(face.y);
    expect(zones.label.y).toBeGreaterThan(zones.name.y + zones.name.height);
    expect(zones.frame.y).toBeGreaterThan(zones.label.y + zones.label.height);
    expect(zones.frame.y + zones.frame.height).toBeLessThan(face.y + face.height);
    expect(zones.stats).toBeNull();

    expect(zones.text.x).toBeGreaterThan(zones.frame.x);
    expect(zones.text.y).toBeGreaterThan(zones.frame.y);
    expect(zones.text.x + zones.text.width).toBeLessThan(zones.frame.x + zones.frame.width);
    expect(zones.text.width).toBeGreaterThan(0);
    expect(zones.text.height).toBeGreaterThan(0);
  });

  it('reserves a footer stats bar and shortens the text box when BG3 stats are present', () => {
    const withoutStats = descriptionZones(face, 0);
    const withTwoStats = descriptionZones(face, 2);
    const withFourStats = descriptionZones(face, 4);

    expect(withTwoStats.stats).not.toBeNull();
    expect(withTwoStats.text.height).toBeLessThan(withoutStats.text.height);
    expect(withTwoStats.text.y + withTwoStats.text.height).toBeLessThan(withTwoStats.stats!.y);
    expect(withFourStats.stats!.height).toBeGreaterThan(withTwoStats.stats!.height);
    expect(withFourStats.text.height).toBeLessThan(withTwoStats.text.height);
  });

  it('extracts and lays out 1–4 BG3 item property chips inside the stats bar', () => {
    const chips = getObjectStatChips({
      stat: '1к8 + 1',
      weight: '1.5 фн.',
      price: '150 зм',
      attunement: true,
    });
    expect(chips).toEqual([
      { kind: 'stat', text: '1к8 + 1' },
      { kind: 'weight', text: '1.5 фн.' },
      { kind: 'price', text: '150 зм' },
      { kind: 'attunement', text: 'Настройка' },
    ]);

    const zones = descriptionZones(face, chips.length);
    const laidOut = layoutObjectStatChips(zones.stats!, chips);
    expect(laidOut).toHaveLength(4);
    for (const c of laidOut) {
      expect(c.slot.x).toBeGreaterThanOrEqual(zones.stats!.x - 1e-9);
      expect(c.slot.x + c.slot.width).toBeLessThanOrEqual(zones.stats!.x + zones.stats!.width + 1e-9);
      expect(c.textRect.x).toBeGreaterThan(c.icon.cx + c.icon.r);
      expect(c.textRect.width).toBeGreaterThan(0);
    }
  });

  it('shares the same width rhythm as the shirt (name plate aligns with name band)', () => {
    const shirt = shirtZones(face, true);
    const desc = descriptionZones(face);
    expect(desc.name.width).toBeCloseTo(shirt.name.width, 9);
    expect(desc.frame.width).toBeCloseTo(shirt.image.width, 9);
  });
});

describe('screen preview layouts', () => {
  it('shirt percentages stay inside the face and keep the zone order', () => {
    const layout = shirtPreviewLayout(true);

    for (const box of [layout.name, layout.image, layout.scroll!]) {
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.top).toBeGreaterThanOrEqual(0);
      expect(box.left + box.width).toBeLessThanOrEqual(100.000001);
      expect(box.top + box.height).toBeLessThanOrEqual(100.000001);
      expect(box.width).toBeGreaterThan(0);
      expect(box.height).toBeGreaterThan(0);
    }
    expect(layout.name.top + layout.name.height).toBeLessThan(layout.image.top);
    expect(layout.image.top + layout.image.height).toBeLessThan(layout.scroll!.top);
    expect(layout.badge.left).toBeGreaterThan(50);
    expect(layout.badge.size).toBeGreaterThan(0);
    expect(layout.badge.size).toBeLessThan(100 - layout.badge.left + 0.001);
  });

  it('no slogan means no scroll box and a taller image', () => {
    const withScroll = shirtPreviewLayout(true);
    const withoutScroll = shirtPreviewLayout(false);
    expect(withoutScroll.scroll).toBeNull();
    expect(withoutScroll.image.height).toBeGreaterThan(withScroll.image.height);
  });

  it('description percentages nest text and stat chips inside frame inside face', () => {
    const chips = getObjectStatChips({ stat: '2к4 + 2', price: '50 зм', weight: '', attunement: false });
    const layout = descriptionPreviewLayout(chips);
    expect(layout.name.top).toBeLessThan(layout.label.top);
    expect(layout.label.top + layout.label.height).toBeLessThanOrEqual(layout.frame.top);
    expect(layout.text.left).toBeGreaterThan(layout.frame.left);
    expect(layout.text.left + layout.text.width).toBeLessThan(layout.frame.left + layout.frame.width);
    expect(layout.frame.top + layout.frame.height).toBeLessThanOrEqual(100.000001);
    expect(layout.statChips).toHaveLength(2);
    expect(layout.text.top + layout.text.height).toBeLessThan(layout.stats!.top);
  });

  it('preview typography derives from print font sizes scaled to cell height', () => {
    const type = objectPreviewTypography();
    const cellHeight = getGameObjectCellHeight();
    expect(type.nameCqh).toBeCloseTo((OBJECT_NAME_FONT_MM / cellHeight) * 100, 9);
    expect(type.textCqh).toBeCloseTo((OBJECT_TEXT_FONT_MM / cellHeight) * 100, 9);
    expect(type.textCqh).toBeLessThan(type.nameCqh);
  });

  it('shrinks long names and descriptions and computes tailpiece Y for short descriptions', () => {
    const fakeMeasure = (sizeMm: number, text: string) => text.length * sizeMm * 0.55;
    const shortObj = {
      name: 'Зелье',
      slogan: 'Коротко',
      description: '2к4 + 2 хитов.',
      quantity: 2,
    };
    const longObj = {
      name: 'Чрезвычайно длинное название легендарного двуручного клинка древних королей',
      slogan: 'Очень длинный слоган на свитке, который должен автоматически уменьшить кегль текста',
      description: Array.from({ length: 80 }, () => 'Длинное слово описания').join(' '),
      quantity: 1,
    };

    const shortFit = fitObjectPreviewTypography(shortObj, fakeMeasure);
    const longFit = fitObjectPreviewTypography(longObj, fakeMeasure);

    expect(longFit.shirtNameCqh).toBeLessThan(shortFit.shirtNameCqh);
    expect(longFit.sloganCqh).toBeLessThan(shortFit.sloganCqh);
    expect(longFit.textCqh).toBeLessThan(shortFit.textCqh);
    expect(shortFit.descriptionOverflow).toBe(false);
    expect(shortFit.tailpieceY).not.toBeNull();
    expect(longFit.descriptionOverflow).toBe(true);
    expect(longFit.tailpieceY).toBeNull();
  });
});

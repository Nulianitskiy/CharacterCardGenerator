import { describe, expect, it } from 'vitest';
import type { GameObject } from '../types';
import {
  OBJECT_COLUMNS,
  OBJECTS_PER_PAGE,
  PAGE_MARGIN_X_MM,
  PAGE_MARGIN_Y_MM,
  CONTENT_WIDTH_MM,
  CONTENT_HEIGHT_MM,
  getGameObjectCellWidth,
  getGameObjectCellHeight,
} from '../constants';
import {
  descriptionZones,
  objectCutSegments,
  objectFaceRect,
  objectPageCount,
  packObjectSheet,
  shirtZones,
} from './objectLayout';

const cellW = getGameObjectCellWidth();
const cellH = getGameObjectCellHeight();

const obj = (id: string): GameObject =>
  ({
    id,
    name: id,
    theme: 'ruby',
  }) as GameObject;

describe('packObjectSheet', () => {
  it('places shirt and description on two consecutive row-major cells', () => {
    const packed = packObjectSheet([obj('a'), obj('b')]);

    expect(packed.map((p) => [p.object.id, p.side, p.col, p.row])).toEqual([
      ['a', 'shirt', 0, 0],
      ['a', 'description', 1, 0],
      ['b', 'shirt', 2, 0],
      ['b', 'description', 0, 1],
    ]);
  });

  it('fills a page with four objects and starts the fifth on a new page', () => {
    const packed = packObjectSheet(['1', '2', '3', '4', '5'].map(obj));
    expect(packed).toHaveLength(10);

    const pages = packed.map((p) => p.page);
    expect(pages.slice(0, 8)).toEqual(Array(8).fill(0));
    expect(pages.slice(8)).toEqual([1, 1]);
    expect(packed[8]).toMatchObject({ object: obj('5'), side: 'shirt', col: 0, row: 0, page: 1 });

    expect(OBJECTS_PER_PAGE).toBe(4);
    expect(objectPageCount(['1', '2', '3', '4'].map(obj))).toBe(1);
    expect(objectPageCount(['1', '2', '3', '4', '5'].map(obj))).toBe(2);
    expect(objectPageCount([])).toBe(0);
  });

  it('never touches the ninth cell of a full page', () => {
    const full = packObjectSheet(['1', '2', '3', '4'].map(obj));
    const lastCell = full.map((p) => p.row * OBJECT_COLUMNS + p.col);
    expect(lastCell).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });
});

describe('objectFaceRect', () => {
  it('maps grid cells onto the A4 content area', () => {
    expect(objectFaceRect(0, 0)).toEqual({ x: PAGE_MARGIN_X_MM, y: PAGE_MARGIN_Y_MM, width: cellW, height: cellH });
    expect(objectFaceRect(2, 2)).toMatchObject({
      x: PAGE_MARGIN_X_MM + 2 * cellW,
      y: PAGE_MARGIN_Y_MM + 2 * cellH,
    });
    const last = objectFaceRect(2, 2);
    expect(last.x + last.width).toBeCloseTo(PAGE_MARGIN_X_MM + CONTENT_WIDTH_MM, 9);
    expect(last.y + last.height).toBeCloseTo(PAGE_MARGIN_Y_MM + CONTENT_HEIGHT_MM, 9);
  });
});

describe('objectCutSegments', () => {
  it('draws the grid around filled faces only (four objects, 9th cell stays empty)', () => {
    const segments = objectCutSegments(OBJECTS_PER_PAGE);
    // 4 vertical borders + 2 inner horizontals.
    expect(segments).toHaveLength(6);

    const verticals = segments.filter((s) => s.x1 === s.x2);
    const horizontals = segments.filter((s) => s.y1 === s.y2);
    expect(verticals).toHaveLength(4);
    expect(horizontals).toHaveLength(2);

    // The right page edge follows the short last row (cells 0-1 of row 2 only).
    const rightEdge = verticals[verticals.length - 1];
    expect(rightEdge.y2 - rightEdge.y1).toBeCloseTo(2 * cellH, 9);
    // All other vertical borders run the full three rows.
    for (const v of verticals.slice(0, -1)) {
      expect(v.y2 - v.y1).toBeCloseTo(3 * cellH, 9);
    }
  });

  it('two objects fill the first row only', () => {
    const segments = objectCutSegments(2);
    const horizontals = segments.filter((s) => s.y1 === s.y2);
    expect(horizontals).toHaveLength(1);
    expect(horizontals[0].x2 - horizontals[0].x1).toBeCloseTo(3 * cellW, 9);
  });

  it('nothing to cut for zero objects', () => {
    expect(objectCutSegments(0)).toEqual([]);
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
    // Scroll is inset deeper than the image window, like the reference sheet.
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
    // The badge sits near the top-right of the image window but stays on-card.
    expect(zones.badge.cx + zones.badge.r).toBeLessThanOrEqual(face.x + face.width);
    expect(zones.badge.cy - zones.badge.r).toBeGreaterThanOrEqual(face.y);
  });
});

describe('descriptionZones', () => {
  const face = objectFaceRect(1, 1);

  it('stacks plate, label, frame and the text rect inside', () => {
    const zones = descriptionZones(face);
    expect(zones.name.y).toBeGreaterThan(face.y);
    expect(zones.label.y).toBeGreaterThan(zones.name.y + zones.name.height);
    expect(zones.frame.y).toBeGreaterThan(zones.label.y + zones.label.height);
    expect(zones.frame.y + zones.frame.height).toBeLessThan(face.y + face.height);

    // Text box is the frame minus even padding on all sides.
    expect(zones.text.x).toBeGreaterThan(zones.frame.x);
    expect(zones.text.y).toBeGreaterThan(zones.frame.y);
    expect(zones.text.x + zones.text.width).toBeLessThan(zones.frame.x + zones.frame.width);
    expect(zones.text.width).toBeGreaterThan(0);
    expect(zones.text.height).toBeGreaterThan(0);
  });

  it('shares the same width rhythm as the shirt (name plate aligns with name band)', () => {
    const shirt = shirtZones(face, true);
    const desc = descriptionZones(face);
    expect(desc.name.width).toBeCloseTo(shirt.name.width, 9);
    expect(desc.frame.width).toBeCloseTo(shirt.image.width, 9);
  });
});

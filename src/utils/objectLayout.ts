/**
 * Pure placement math for the object-card sheet (physical item cards).
 *
 * One object prints as two adjacent faces — the «shirt» (image, name, slogan
 * scroll, optional quantity badge) followed by its «description» (framed
 * justified text). Faces fill a 3×3 grid row-major, so each pair occupies two
 * consecutive cells and can be cut and glued without hunting for its match.
 * The ninth cell of a full sheet stays empty.
 *
 * No jsPDF and no DOM: `pdfGenerator`/components consume the rects, same
 * pattern as `pawnLayout.ts` and `pdfLayout.ts`.
 */

import {
  OBJECT_COLUMNS,
  OBJECT_FACES_PER_OBJECT,
  OBJECTS_PER_PAGE,
  PAGE_MARGIN_X_MM,
  PAGE_MARGIN_Y_MM,
  getGameObjectCellWidth,
  getGameObjectCellHeight,
  OBJECT_CORNER_RADIUS_FRACTION,
  OBJECT_SHIRT_NAME_FRACTION,
  OBJECT_SHIRT_SCROLL_FRACTION,
  OBJECT_SHIRT_GAP_FRACTION,
  OBJECT_SHIRT_SIDE_INSET_FRACTION,
  OBJECT_SHIRT_SCROLL_SIDE_INSET_FRACTION,
  OBJECT_BADGE_DIAMETER_FRACTION,
  OBJECT_BADGE_INSET_FRACTION,
  OBJECT_DESC_NAME_FRACTION,
  OBJECT_DESC_LABEL_FRACTION,
  OBJECT_DESC_SIDE_INSET_FRACTION,
  OBJECT_DESC_TEXT_PADDING_FRACTION,
  OBJECT_BADGE_FONT_MM,
  OBJECT_LABEL_FONT_MM,
  OBJECT_NAME_FONT_MM,
  OBJECT_SLOGAN_FONT_MM,
  OBJECT_TEXT_FONT_MM,
} from '../constants';
import type { GameObject } from '../types';
import type { RectMm, SegmentMm } from './pdfLayout';
import { gridCutSegments } from './pdfLayout';

export type ObjectFaceSide = 'shirt' | 'description';

export interface ObjectFacePlacement {
  object: GameObject;
  side: ObjectFaceSide;
  page: number;
  col: number;
  row: number;
}

/** Row-major cell order of one sheet: shirt of object n, then its description. */
export const packObjectSheet = (objects: GameObject[]): ObjectFacePlacement[] => {
  const placements: ObjectFacePlacement[] = [];

  objects.forEach((object, index) => {
    const page = Math.floor(index / OBJECTS_PER_PAGE);
    const cellOnPage = (index % OBJECTS_PER_PAGE) * OBJECT_FACES_PER_OBJECT;
    for (let face = 0; face < OBJECT_FACES_PER_OBJECT; face++) {
      const cell = cellOnPage + face;
      placements.push({
        object,
        side: face === 0 ? 'shirt' : 'description',
        page,
        col: cell % OBJECT_COLUMNS,
        row: Math.floor(cell / OBJECT_COLUMNS),
      });
    }
  });

  return placements;
};

export const objectPageCount = (objects: GameObject[]): number =>
  objects.length === 0
    ? 0
    : Math.floor((objects.length - 1) / OBJECTS_PER_PAGE) + 1;

export const objectFaceRect = (col: number, row: number): RectMm => ({
  x: PAGE_MARGIN_X_MM + col * getGameObjectCellWidth(),
  y: PAGE_MARGIN_Y_MM + row * getGameObjectCellHeight(),
  width: getGameObjectCellWidth(),
  height: getGameObjectCellHeight(),
});

/**
 * White grid between filled faces of a page. `gridCutSegments` already models
 * row-major fill with a short last row, which is exactly how pairs are placed.
 */
export const objectCutSegments = (objectsOnPage: number): SegmentMm[] =>
  gridCutSegments(objectsOnPage * OBJECT_FACES_PER_OBJECT, {
    columns: OBJECT_COLUMNS,
    cellWidthMm: getGameObjectCellWidth(),
    cellHeightMm: getGameObjectCellHeight(),
    originX: PAGE_MARGIN_X_MM,
    originY: PAGE_MARGIN_Y_MM,
  });

export interface BadgeMm {
  cx: number;
  cy: number;
  r: number;
}

export interface ShirtZones {
  /** Full face rect (the colored card background). */
  card: RectMm;
  /** Name band on the card background, top of the face. */
  name: RectMm;
  /** Paper window for the item image. */
  image: RectMm;
  /** Paper scroll for the slogan; null when the object has no slogan. */
  scroll: RectMm | null;
  /** Quantity badge circle (renderer skips it when quantity is null). */
  badge: BadgeMm;
  /** Rounded corner radius for the card background. */
  cornerRadius: number;
}

/**
 * Zone rects inside a shirt face. Without a slogan the image window grows to
 * the bottom inset, so the picture keeps the full remaining height.
 */
export const shirtZones = (face: RectMm, hasSlogan: boolean): ShirtZones => {
  const insetX = face.width * OBJECT_SHIRT_SIDE_INSET_FRACTION;
  const gap = face.height * OBJECT_SHIRT_GAP_FRACTION;
  const nameHeight = face.height * OBJECT_SHIRT_NAME_FRACTION;

  const name: RectMm = {
    x: face.x + insetX,
    y: face.y + insetX * 0.6,
    width: face.width - 2 * insetX,
    height: nameHeight,
  };

  const scrollHeight = face.height * OBJECT_SHIRT_SCROLL_FRACTION;
  const scrollInsetX = face.width * OBJECT_SHIRT_SCROLL_SIDE_INSET_FRACTION;
  const bottomY = face.y + face.height - insetX * 0.6;

  const scroll: RectMm | null = hasSlogan
    ? {
        x: face.x + scrollInsetX,
        y: bottomY - scrollHeight,
        width: face.width - 2 * scrollInsetX,
        height: scrollHeight,
      }
    : null;

  const imageBottom = scroll ? scroll.y - gap : bottomY;

  return {
    card: face,
    name,
    image: {
      x: face.x + insetX,
      y: name.y + name.height + gap,
      width: face.width - 2 * insetX,
      height: imageBottom - (name.y + name.height + gap),
    },
    scroll,
    badge: {
      cx:
        face.x + face.width - face.width * OBJECT_BADGE_INSET_FRACTION - (face.width * OBJECT_BADGE_DIAMETER_FRACTION) / 2,
      cy:
        name.y +
        name.height +
        gap +
        face.height * OBJECT_BADGE_INSET_FRACTION +
        (face.width * OBJECT_BADGE_DIAMETER_FRACTION) / 2,
      r: (face.width * OBJECT_BADGE_DIAMETER_FRACTION) / 2,
    },
    cornerRadius: face.width * OBJECT_CORNER_RADIUS_FRACTION,
  };
};

export interface DescriptionZones {
  /** Full face rect (the colored card background). */
  card: RectMm;
  /** Paper name plate, top of the face. */
  name: RectMm;
  /** Band for the «Описание» label on the card background. */
  label: RectMm;
  /** Outer edge of the framed text box (fill + border live here). */
  frame: RectMm;
  /** Usable text rect inside the frame. */
  text: RectMm;
  cornerRadius: number;
}

/** Zone rects inside a description face: name plate, label, framed text box. */
export const descriptionZones = (face: RectMm): DescriptionZones => {
  const insetX = face.width * OBJECT_DESC_SIDE_INSET_FRACTION;
  const gap = face.height * OBJECT_SHIRT_GAP_FRACTION;

  const name: RectMm = {
    x: face.x + insetX,
    y: face.y + insetX * 0.6,
    width: face.width - 2 * insetX,
    height: face.height * OBJECT_DESC_NAME_FRACTION,
  };

  const label: RectMm = {
    x: name.x,
    y: name.y + name.height + gap,
    width: name.width,
    height: face.height * OBJECT_DESC_LABEL_FRACTION,
  };

  const frameTop = label.y + label.height + gap;
  const frame: RectMm = {
    x: insetX + face.x,
    y: frameTop,
    width: face.width - 2 * insetX,
    height: face.y + face.height - insetX * 0.6 - frameTop,
  };

  const pad = face.width * OBJECT_DESC_TEXT_PADDING_FRACTION;

  return {
    card: face,
    name,
    label,
    frame,
    text: {
      x: frame.x + pad,
      y: frame.y + pad,
      width: frame.width - 2 * pad,
      height: frame.height - 2 * pad,
    },
    cornerRadius: face.width * OBJECT_CORNER_RADIUS_FRACTION,
  };
};

// --- Screen preview helpers -------------------------------------------------

/**
 * A box in face-relative percentages, ready for absolute positioning inside a
 * preview element whose aspect matches the printed face.
 */
export interface PercentBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface ShirtPreviewLayout {
  cornerRadiusPct: number;
  name: PercentBox;
  image: PercentBox;
  scroll: PercentBox | null;
  /** Circle: left/top are of its box; diameter comes as `size` (of width). */
  badge: { left: number; top: number; size: number };
}

export interface DescriptionPreviewLayout {
  cornerRadiusPct: number;
  name: PercentBox;
  label: PercentBox;
  frame: PercentBox;
  text: PercentBox;
}

const toPercentBox = (rect: RectMm): PercentBox => ({
  left: (rect.x / getGameObjectCellWidth()) * 100,
  top: (rect.y / getGameObjectCellHeight()) * 100,
  width: (rect.width / getGameObjectCellWidth()) * 100,
  height: (rect.height / getGameObjectCellHeight()) * 100,
});

const previewFaceRect = (): RectMm => ({
  x: 0,
  y: 0,
  width: getGameObjectCellWidth(),
  height: getGameObjectCellHeight(),
});

/** Shirt zones in screen percentages — same source as the PDF placement. */
export const shirtPreviewLayout = (hasSlogan: boolean): ShirtPreviewLayout => {
  const zones = shirtZones(previewFaceRect(), hasSlogan);
  const diameterMm = zones.badge.r * 2;
  return {
    cornerRadiusPct: (zones.cornerRadius / getGameObjectCellWidth()) * 100,
    name: toPercentBox(zones.name),
    image: toPercentBox(zones.image),
    scroll: zones.scroll ? toPercentBox(zones.scroll) : null,
    badge: {
      left: ((zones.badge.cx - zones.badge.r) / getGameObjectCellWidth()) * 100,
      top: ((zones.badge.cy - zones.badge.r) / getGameObjectCellHeight()) * 100,
      size: (diameterMm / getGameObjectCellWidth()) * 100,
    },
  };
};

/** Description zones in screen percentages. */
export const descriptionPreviewLayout = (): DescriptionPreviewLayout => {
  const zones = descriptionZones(previewFaceRect());
  return {
    cornerRadiusPct: (zones.cornerRadius / getGameObjectCellWidth()) * 100,
    name: toPercentBox(zones.name),
    label: toPercentBox(zones.label),
    frame: toPercentBox(zones.frame),
    text: toPercentBox(zones.text),
  };
};

/**
 * Print font sizes translated to container-query heights (`cqh`) so preview
 * type scales with the tile exactly like print type scales with the face.
 */
export const objectPreviewTypography = () => {
  const cellHeight = getGameObjectCellHeight();
  return {
    nameCqh: (OBJECT_NAME_FONT_MM / cellHeight) * 100,
    textCqh: (OBJECT_TEXT_FONT_MM / cellHeight) * 100,
    sloganCqh: (OBJECT_SLOGAN_FONT_MM / cellHeight) * 100,
    labelCqh: (OBJECT_LABEL_FONT_MM / cellHeight) * 100,
    badgeCqh: (OBJECT_BADGE_FONT_MM / cellHeight) * 100,
  };
};

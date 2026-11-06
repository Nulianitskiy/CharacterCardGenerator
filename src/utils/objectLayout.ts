/**
 * Pure placement math for the object-card sheet (physical item cards).
 *
 * One object prints as two adjacent faces — the «shirt» (image, name, slogan
 * scroll, optional quantity badge) followed by its «description» (framed
 * justified text + optional BG3 item property tags). Faces fill a 4×4 grid
 * row-major (2 pairs per row × 4 rows = 8 objects per A4 sheet), so every pair
 * sits side-by-side in the same row with a fold line between shirt and
 * description and zero wasted cells on a full page.
 *
 * No jsPDF and no DOM: `pdfGenerator`/components consume the rects, same
 * pattern as `pawnLayout.ts` and `pdfLayout.ts`.
 */

import {
  FOLD_LINE_INSET_MM,
  OBJECT_COLUMNS,
  OBJECT_FACES_PER_OBJECT,
  OBJECTS_PER_PAGE,
  PAGE_MARGIN_X_MM,
  PAGE_MARGIN_Y_MM,
  PRINT_PX_PER_MM,
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
  OBJECT_DESC_STATS_SINGLE_ROW_FRACTION,
  OBJECT_DESC_STATS_DOUBLE_ROW_FRACTION,
  OBJECT_BADGE_FONT_MM,
  OBJECT_LABEL_FONT_MM,
  OBJECT_LINE_HEIGHT_FACTOR,
  OBJECT_MIN_FONT_FRACTION,
  OBJECT_NAME_FONT_MM,
  OBJECT_SLOGAN_FONT_MM,
  OBJECT_STAT_FONT_MM,
  OBJECT_TEXT_FONT_MM,
} from '../constants';
import type { GameObject } from '../types';
import { fitJustifiedText } from './justifiedText';
import { measureNameWithCanvas } from './nameLabelRender';
import { buildScrollVector, type ObjectStatKind } from './objectFrames';
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

/**
 * Dashed vertical fold lines between each object's shirt and its adjacent
 * description on the same row, so a pair can be cut as one 2×1 strip and
 * folded in half.
 */
export const objectFoldSegments = (objectsOnPage: number): SegmentMm[] => {
  const count = Math.max(0, Math.min(OBJECTS_PER_PAGE, objectsOnPage));
  const cellW = getGameObjectCellWidth();
  const cellH = getGameObjectCellHeight();
  const segments: SegmentMm[] = [];

  for (let i = 0; i < count; i++) {
    const shirtCell = i * OBJECT_FACES_PER_OBJECT;
    const col = shirtCell % OBJECT_COLUMNS;
    const row = Math.floor(shirtCell / OBJECT_COLUMNS);
    const foldX = PAGE_MARGIN_X_MM + (col + 1) * cellW;
    const yTop = PAGE_MARGIN_Y_MM + row * cellH + FOLD_LINE_INSET_MM;
    const yBottom = PAGE_MARGIN_Y_MM + (row + 1) * cellH - FOLD_LINE_INSET_MM;
    segments.push({ x1: foldX, y1: yTop, x2: foldX, y2: yBottom });
  }

  return segments;
};

export interface ObjectStatChip {
  kind: ObjectStatKind;
  text: string;
}

/** Extracts active BG3 item property tags in display order. */
export const getObjectStatChips = (
  object: Pick<GameObject, 'stat' | 'weight' | 'price' | 'attunement'>
): ObjectStatChip[] => {
  const chips: ObjectStatChip[] = [];
  if (object.stat?.trim()) {
    chips.push({ kind: 'stat', text: object.stat.trim() });
  }
  if (object.weight?.trim()) {
    chips.push({ kind: 'weight', text: object.weight.trim() });
  }
  if (object.price?.trim()) {
    chips.push({ kind: 'price', text: object.price.trim() });
  }
  if (object.attunement) {
    chips.push({ kind: 'attunement', text: 'Настройка' });
  }
  return chips;
};

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
  /** Continuous paper window spanning from below the name band to the bottom inset. */
  window: RectMm;
  /** Illustration area inside the paper window. */
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
  const windowTop = name.y + name.height + gap;

  const window: RectMm = {
    x: face.x + insetX,
    y: windowTop,
    width: face.width - 2 * insetX,
    height: bottomY - windowTop,
  };

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
    window,
    image: {
      x: face.x + insetX,
      y: windowTop,
      width: face.width - 2 * insetX,
      height: imageBottom - windowTop,
    },
    scroll,
    badge: {
      cx:
        face.x +
        face.width -
        face.width * OBJECT_BADGE_INSET_FRACTION -
        (face.width * OBJECT_BADGE_DIAMETER_FRACTION) / 2,
      cy:
        windowTop +
        face.width * (OBJECT_BADGE_INSET_FRACTION - OBJECT_SHIRT_SIDE_INSET_FRACTION) +
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
  /** Band for the rarity subtitle on the card background. */
  label: RectMm;
  /** Outer edge of the framed text box (fill + border live here). */
  frame: RectMm;
  /** Usable text rect inside the frame (shortened when `stats` is present). */
  text: RectMm;
  /** Optional footer bar inside `frame` for BG3 item property chips. */
  stats: RectMm | null;
  cornerRadius: number;
}

/**
 * Zone rects inside a description face: name plate, rarity label, framed text
 * box and optional BG3 stats footer bar.
 */
export const descriptionZones = (face: RectMm, statChipCount = 0): DescriptionZones => {
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
  const statsFraction =
    statChipCount <= 0
      ? 0
      : statChipCount <= 2
        ? OBJECT_DESC_STATS_SINGLE_ROW_FRACTION
        : OBJECT_DESC_STATS_DOUBLE_ROW_FRACTION;
  const statsHeight = face.height * statsFraction;

  const stats: RectMm | null =
    statChipCount > 0
      ? {
          x: frame.x + pad * 0.75,
          y: frame.y + frame.height - pad * 0.65 - statsHeight,
          width: frame.width - pad * 1.5,
          height: statsHeight,
        }
      : null;

  const textBottom = stats ? stats.y - pad * 0.45 : frame.y + frame.height - pad;

  return {
    card: face,
    name,
    label,
    frame,
    text: {
      x: frame.x + pad,
      y: frame.y + pad,
      width: frame.width - 2 * pad,
      height: Math.max(1, textBottom - (frame.y + pad)),
    },
    stats,
    cornerRadius: face.width * OBJECT_CORNER_RADIUS_FRACTION,
  };
};

export interface LaidOutStatChip {
  kind: ObjectStatKind;
  text: string;
  slot: RectMm;
  icon: { cx: number; cy: number; r: number };
  textRect: RectMm;
}

/**
 * Places 1–4 BG3 item property chips inside `statsRect` (1 row for 1–2 chips,
 * 2×2 grid for 3–4 chips) so every chip has ample horizontal room for its
 * vector icon and value.
 */
export const layoutObjectStatChips = (
  statsRect: RectMm,
  chips: ObjectStatChip[]
): LaidOutStatChip[] => {
  if (chips.length === 0) return [];

  const rows = chips.length <= 2 ? 1 : 2;
  const cols = chips.length === 1 ? 1 : 2;
  const rowH = statsRect.height / rows;

  return chips.map((chip, index) => {
    const row = Math.floor(index / cols);
    const isLastOddInTwoRows = chips.length === 3 && index === 2;
    const col = isLastOddInTwoRows ? 0 : index % cols;
    const slotW = isLastOddInTwoRows ? statsRect.width : statsRect.width / cols;
    const slot: RectMm = {
      x: statsRect.x + col * slotW,
      y: statsRect.y + row * rowH,
      width: slotW,
      height: rowH,
    };

    const iconR = Math.min(rowH * 0.28, 1.35);
    const padX = isLastOddInTwoRows ? slot.width * 0.22 : 1.0;
    const iconCx = slot.x + padX + iconR;
    const iconCy = slot.y + slot.height / 2;
    const textX = iconCx + iconR + 0.9;

    return {
      kind: chip.kind,
      text: chip.text,
      slot,
      icon: { cx: iconCx, cy: iconCy, r: iconR },
      textRect: {
        x: textX,
        y: slot.y + slot.height * 0.12,
        width: Math.max(1, slot.x + slot.width - padX - textX),
        height: slot.height * 0.76,
      },
    };
  });
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
  window: PercentBox;
  image: PercentBox;
  scroll: PercentBox | null;
  scrollText: PercentBox | null;
  /** Circle: left/top are of its box; diameter comes as `size` (of width). */
  badge: { left: number; top: number; size: number };
}

export interface PreviewStatChip {
  kind: ObjectStatKind;
  text: string;
  icon: { cx: number; cy: number; r: number };
  textBox: PercentBox;
}

export interface DescriptionPreviewLayout {
  cornerRadiusPct: number;
  name: PercentBox;
  label: PercentBox;
  frame: PercentBox;
  text: PercentBox;
  stats: PercentBox | null;
  statChips: PreviewStatChip[];
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
  const scrollVec = zones.scroll ? buildScrollVector(zones.scroll) : null;
  return {
    cornerRadiusPct: (zones.cornerRadius / getGameObjectCellWidth()) * 100,
    name: toPercentBox(zones.name),
    window: toPercentBox(zones.window),
    image: toPercentBox(zones.image),
    scroll: zones.scroll ? toPercentBox(zones.scroll) : null,
    scrollText: scrollVec ? toPercentBox(scrollVec.textBox) : null,
    badge: {
      left: ((zones.badge.cx - zones.badge.r) / getGameObjectCellWidth()) * 100,
      top: ((zones.badge.cy - zones.badge.r) / getGameObjectCellHeight()) * 100,
      size: (diameterMm / getGameObjectCellWidth()) * 100,
    },
  };
};

/** Description zones in screen percentages. */
export const descriptionPreviewLayout = (
  chips: ObjectStatChip[] = []
): DescriptionPreviewLayout => {
  const zones = descriptionZones(previewFaceRect(), chips.length);
  const laidOut = zones.stats ? layoutObjectStatChips(zones.stats, chips) : [];
  return {
    cornerRadiusPct: (zones.cornerRadius / getGameObjectCellWidth()) * 100,
    name: toPercentBox(zones.name),
    label: toPercentBox(zones.label),
    frame: toPercentBox(zones.frame),
    text: toPercentBox(zones.text),
    stats: zones.stats ? toPercentBox(zones.stats) : null,
    statChips: laidOut.map((c) => ({
      kind: c.kind,
      text: c.text,
      icon: c.icon,
      textBox: toPercentBox(c.textRect),
    })),
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
    statCqh: (OBJECT_STAT_FONT_MM / cellHeight) * 100,
  };
};

export interface FittedObjectTypography {
  shirtNameCqh: number;
  descNameCqh: number;
  sloganCqh: number;
  textCqh: number;
  labelCqh: number;
  badgeCqh: number;
  statCqh: number;
  descriptionOverflow: boolean;
  /** Millimeter Y position for the book-style tailpiece under short descriptions, or null. */
  tailpieceY: number | null;
}

/**
 * Computes auto-fitted font sizes (in `cqh`) and overflow status for an object
 * card using the exact same `fitJustifiedText` geometry as the PDF renderer.
 */
export const fitObjectPreviewTypography = (
  object: Pick<
    GameObject,
    'name' | 'slogan' | 'description' | 'quantity' | 'stat' | 'weight' | 'price' | 'attunement'
  >,
  measureMmAt: (fontSizeMm: number, text: string) => number = (fontSizeMm, text) =>
    measureNameWithCanvas('medieval', fontSizeMm * PRINT_PX_PER_MM, text) / PRINT_PX_PER_MM
): FittedObjectTypography => {
  const cellWidth = getGameObjectCellWidth();
  const cellHeight = getGameObjectCellHeight();
  const u = cellWidth / 66.67;
  const face = previewFaceRect();
  const hasSlogan = object.slogan.trim() !== '';
  const chips = getObjectStatChips(object);
  const shirt = shirtZones(face, hasSlogan);
  const desc = descriptionZones(face, chips.length);
  const makeMeasure = (sizeMm: number) => (s: string) => measureMmAt(sizeMm, s);

  const shirtNameBox: RectMm = {
    x: shirt.name.x + 2.4 * u,
    y: shirt.name.y + 0.8 * u,
    width: shirt.name.width - 4.8 * u,
    height: shirt.name.height - 1.6 * u,
  };
  const shirtNameFit = fitJustifiedText({
    text: object.name.trim(),
    width: shirtNameBox.width,
    height: shirtNameBox.height,
    baseFontSize: OBJECT_NAME_FONT_MM,
    minFontSize: OBJECT_NAME_FONT_MM * 0.5,
    lineHeightFactor: 1.12,
    makeMeasure,
  });

  const descNameBox: RectMm = {
    x: desc.name.x + 3.2 * u,
    y: desc.name.y + 1.4 * u,
    width: desc.name.width - 6.4 * u,
    height: desc.name.height - 2.8 * u,
  };
  const descNameFit = fitJustifiedText({
    text: object.name.trim(),
    width: descNameBox.width,
    height: descNameBox.height,
    baseFontSize: OBJECT_NAME_FONT_MM,
    minFontSize: OBJECT_NAME_FONT_MM * 0.5,
    lineHeightFactor: 1.12,
    makeMeasure,
  });

  let sloganFontMm = OBJECT_SLOGAN_FONT_MM;
  if (shirt.scroll) {
    const scrollVec = buildScrollVector(shirt.scroll);
    const sloganFit = fitJustifiedText({
      text: object.slogan.trim(),
      width: scrollVec.textBox.width,
      height: scrollVec.textBox.height,
      baseFontSize: OBJECT_SLOGAN_FONT_MM,
      minFontSize: OBJECT_SLOGAN_FONT_MM * 0.55,
      lineHeightFactor: 1.15,
      makeMeasure,
    });
    sloganFontMm = sloganFit.fontSize;
  }

  const descFit = fitJustifiedText({
    text: object.description,
    width: desc.text.width,
    height: desc.text.height,
    baseFontSize: OBJECT_TEXT_FONT_MM,
    minFontSize: OBJECT_TEXT_FONT_MM * OBJECT_MIN_FONT_FRACTION,
    lineHeightFactor: OBJECT_LINE_HEIGHT_FACTOR,
    makeMeasure,
  });

  const textHeightUsed = descFit.lines.length * descFit.lineHeight;
  const remainingHeight = desc.text.height - textHeightUsed;
  const minTailGap = 6.0 * u;
  const tailpieceY =
    descFit.lines.length > 0 && !descFit.overflow && remainingHeight >= minTailGap
      ? desc.text.y + textHeightUsed + Math.min(4.0 * u, remainingHeight * 0.38)
      : null;

  return {
    shirtNameCqh: (shirtNameFit.fontSize / cellHeight) * 100,
    descNameCqh: (descNameFit.fontSize / cellHeight) * 100,
    sloganCqh: (sloganFontMm / cellHeight) * 100,
    textCqh: (descFit.fontSize / cellHeight) * 100,
    labelCqh: (OBJECT_LABEL_FONT_MM / cellHeight) * 100,
    badgeCqh: (OBJECT_BADGE_FONT_MM / cellHeight) * 100,
    statCqh: (OBJECT_STAT_FONT_MM / cellHeight) * 100,
    descriptionOverflow: descFit.overflow,
    tailpieceY,
  };
};

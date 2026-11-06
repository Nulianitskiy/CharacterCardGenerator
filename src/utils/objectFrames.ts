/**
 * Pure millimeter-space vector ornaments for physical object cards.
 *
 * Each Baldur's Gate 3 rarity tier (`ObjectFramePattern`) has its own outer
 * card border, inner parchment panel filigree, divider wings, watermark crest,
 * tailpiece flourish and stat-tag icons. Both the React SVG overlay
 * (`ObjectFaces.tsx`) and the PDF `<canvas>` renderer (`objectPdfRender.ts`
 * via `Path2D`) consume the exact same path strings in face-millimeter
 * coordinates, guaranteeing 1:1 parity between screen and print and allowing
 * Node unit tests with no DOM.
 */

import type { ObjectFramePattern } from '../constants';
import type { RectMm } from './pdfLayout';

export type ObjectStatKind = 'stat' | 'weight' | 'price' | 'attunement';

export interface FrameVectorSpec {
  /** Primary stroke paths (thick outer border / main frame lines). */
  strokePaths: string[];
  /** Secondary hairline stroke paths (inner rules, rays, corner filigree). */
  thinStrokePaths: string[];
  /** Filled ornament paths (gems, rivets, stars, trefoils, seal rings). */
  fillPaths: string[];
  /** Primary stroke width in millimeters. */
  strokeWidthMm: number;
  /** Secondary hairline stroke width in millimeters. */
  thinStrokeWidthMm: number;
}

export interface ScrollVectorSpec {
  /** Central unrolled parchment banner rect between the two spindles. */
  banner: RectMm;
  /** Left and right vertical cylindrical spindles, strictly inside `scrollRect`. */
  leftRoller: RectMm;
  rightRoller: RectMm;
  /** Ornamental top/bottom spindle finials (4 caps). */
  caps: RectMm[];
  /** Double ink rules and scroll-curl lines drawn on the parchment & rollers. */
  rulePaths: string[];
  /** Safe inner text box for the slogan. */
  textBox: RectMm;
}

const f = (value: number): string => Number(value.toFixed(3)).toString();

const circlePath = (cx: number, cy: number, r: number): string =>
  `M ${f(cx - r)} ${f(cy)} A ${f(r)} ${f(r)} 0 1 0 ${f(cx + r)} ${f(cy)} A ${f(r)} ${f(r)} 0 1 0 ${f(cx - r)} ${f(cy)} Z`;

const diamondPath = (cx: number, cy: number, rx: number, ry = rx): string =>
  `M ${f(cx)} ${f(cy - ry)} L ${f(cx + rx)} ${f(cy)} L ${f(cx)} ${f(cy + ry)} L ${f(cx - rx)} ${f(cy)} Z`;

const fourPointStarPath = (cx: number, cy: number, outerR: number, innerR = outerR * 0.36): string => {
  const pts: string[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    pts.push(`${i === 0 ? 'M' : 'L'} ${f(x)} ${f(y)}`);
  }
  return `${pts.join(' ')} Z`;
};

const chamferedRectPath = (x: number, y: number, w: number, h: number, c: number): string => {
  const ch = Math.max(0, Math.min(c, w / 3, h / 3));
  return [
    `M ${f(x + ch)} ${f(y)}`,
    `L ${f(x + w - ch)} ${f(y)}`,
    `L ${f(x + w)} ${f(y + ch)}`,
    `L ${f(x + w)} ${f(y + h - ch)}`,
    `L ${f(x + w - ch)} ${f(y + h)}`,
    `L ${f(x + ch)} ${f(y + h)}`,
    `L ${f(x)} ${f(y + h - ch)}`,
    `L ${f(x)} ${f(y + ch)}`,
    'Z',
  ].join(' ');
};

const concaveCornerRectPath = (x: number, y: number, w: number, h: number, r: number): string => {
  const cr = Math.max(0, Math.min(r, w / 3, h / 3));
  return [
    `M ${f(x + cr)} ${f(y)}`,
    `L ${f(x + w - cr)} ${f(y)}`,
    `A ${f(cr)} ${f(cr)} 0 0 0 ${f(x + w)} ${f(y + cr)}`,
    `L ${f(x + w)} ${f(y + h - cr)}`,
    `A ${f(cr)} ${f(cr)} 0 0 0 ${f(x + w - cr)} ${f(y + h)}`,
    `L ${f(x + cr)} ${f(y + h)}`,
    `A ${f(cr)} ${f(cr)} 0 0 0 ${f(x)} ${f(y + h - cr)}`,
    `L ${f(x)} ${f(y + cr)}`,
    `A ${f(cr)} ${f(cr)} 0 0 0 ${f(x + cr)} ${f(y)}`,
    'Z',
  ].join(' ');
};

const steppedKnotRectPath = (x: number, y: number, w: number, h: number, s: number): string => {
  const k = Math.max(0, Math.min(s, w / 4, h / 4));
  return [
    `M ${f(x + k)} ${f(y)}`,
    `L ${f(x + w - k)} ${f(y)}`,
    `L ${f(x + w - k)} ${f(y + k)}`,
    `L ${f(x + w)} ${f(y + k)}`,
    `L ${f(x + w)} ${f(y + h - k)}`,
    `L ${f(x + w - k)} ${f(y + h - k)}`,
    `L ${f(x + w - k)} ${f(y + h)}`,
    `L ${f(x + k)} ${f(y + h)}`,
    `L ${f(x + k)} ${f(y + h - k)}`,
    `L ${f(x)} ${f(y + h - k)}`,
    `L ${f(x)} ${f(y + k)}`,
    `L ${f(x + k)} ${f(y + k)}`,
    'Z',
  ].join(' ');
};

/**
 * Outer ornamental border drawn on the colored card background near the edges
 * of a face (`0..widthMm × 0..heightMm`).
 */
export const buildCardOuterFrame = (
  widthMm: number,
  heightMm: number,
  pattern: ObjectFramePattern
): FrameVectorSpec => {
  const u = widthMm / 66.67;
  const m = widthMm * 0.024;
  const x = m;
  const y = m;
  const w = widthMm - 2 * m;
  const h = heightMm - 2 * m;

  const strokePaths: string[] = [];
  const thinStrokePaths: string[] = [];
  const fillPaths: string[] = [];

  const corners: Array<{ cx: number; cy: number; sx: number; sy: number }> = [
    { cx: x, cy: y, sx: 1, sy: 1 },
    { cx: x + w, cy: y, sx: -1, sy: 1 },
    { cx: x + w, cy: y + h, sx: -1, sy: -1 },
    { cx: x, cy: y + h, sx: 1, sy: -1 },
  ];

  switch (pattern) {
    case 'forged': {
      // BG3 Common: Chamfered iron border with corner brackets and forged rivets.
      const ch = 2.8 * u;
      strokePaths.push(chamferedRectPath(x, y, w, h, ch));
      for (const c of corners) {
        const bx = c.cx + c.sx * 1.1 * u;
        const by = c.cy + c.sy * 1.1 * u;
        thinStrokePaths.push(
          `M ${f(bx + c.sx * 3.8 * u)} ${f(by)} L ${f(bx + c.sx * 1.6 * u)} ${f(by)} L ${f(bx)} ${f(by + c.sy * 1.6 * u)} L ${f(bx)} ${f(by + c.sy * 3.8 * u)}`
        );
        fillPaths.push(circlePath(c.cx + c.sx * 2.3 * u, c.cy + c.sy * 2.3 * u, 0.55 * u));
      }
      fillPaths.push(circlePath(x, y + h / 2, 0.5 * u));
      fillPaths.push(circlePath(x + w, y + h / 2, 0.5 * u));
      break;
    }

    case 'botanic': {
      // BG3 Uncommon: Stepped ranger weave with corner knot loops and leaf diamonds.
      const step = 2.4 * u;
      strokePaths.push(steppedKnotRectPath(x, y, w, h, step));
      thinStrokePaths.push(chamferedRectPath(x + 1.0 * u, y + 1.0 * u, w - 2.0 * u, h - 2.0 * u, 1.8 * u));
      for (const c of corners) {
        const kx = c.cx + c.sx * (step * 0.55);
        const ky = c.cy + c.sy * (step * 0.55);
        thinStrokePaths.push(
          `M ${f(c.cx)} ${f(c.cy + c.sy * step)} L ${f(c.cx + c.sx * step)} ${f(c.cy + c.sy * step)} L ${f(c.cx + c.sx * step)} ${f(c.cy)}`
        );
        fillPaths.push(diamondPath(kx, ky, 0.75 * u, 0.75 * u));
      }
      break;
    }

    case 'arcane': {
      // BG3 Rare: Double geometric arcane border with diamond corner sigils & 4-point stars.
      strokePaths.push(chamferedRectPath(x, y, w, h, 2.2 * u));
      thinStrokePaths.push(chamferedRectPath(x + 1.1 * u, y + 1.1 * u, w - 2.2 * u, h - 2.2 * u, 3.2 * u));
      for (const c of corners) {
        const scx = c.cx + c.sx * 2.2 * u;
        const scy = c.cy + c.sy * 2.2 * u;
        thinStrokePaths.push(diamondPath(scx, scy, 1.7 * u, 1.7 * u));
        fillPaths.push(fourPointStarPath(scx, scy, 1.15 * u, 0.4 * u));
      }
      fillPaths.push(diamondPath(x, y + h / 2, 0.8 * u, 1.3 * u));
      fillPaths.push(diamondPath(x + w, y + h / 2, 0.8 * u, 1.3 * u));
      break;
    }

    case 'gothic': {
      // BG3 Very Rare: Concave gothic arches, corner trefoil spears and twin side clasps.
      const archR = 3.2 * u;
      strokePaths.push(concaveCornerRectPath(x, y, w, h, archR));
      thinStrokePaths.push(
        concaveCornerRectPath(x + 1.0 * u, y + 1.0 * u, w - 2.0 * u, h - 2.0 * u, archR + 0.6 * u)
      );
      for (const c of corners) {
        const tx = c.cx + c.sx * 1.5 * u;
        const ty = c.cy + c.sy * 1.5 * u;
        fillPaths.push(diamondPath(tx, ty, 0.9 * u, 0.9 * u));
        fillPaths.push(circlePath(c.cx + c.sx * 2.8 * u, c.cy + c.sy * 1.1 * u, 0.48 * u));
        fillPaths.push(circlePath(c.cx + c.sx * 1.1 * u, c.cy + c.sy * 2.8 * u, 0.48 * u));
      }
      for (const sx of [x, x + w]) {
        fillPaths.push(diamondPath(sx, y + h * 0.35, 0.7 * u, 1.1 * u));
        fillPaths.push(diamondPath(sx, y + h * 0.65, 0.7 * u, 1.1 * u));
      }
      break;
    }

    case 'royal': {
      // BG3 Legendary: Triple royal frame with sunburst rays in all 4 corners and solar medallions.
      strokePaths.push(chamferedRectPath(x, y, w, h, 2.0 * u));
      thinStrokePaths.push(
        steppedKnotRectPath(x + 1.0 * u, y + 1.0 * u, w - 2.0 * u, h - 2.0 * u, 2.6 * u)
      );
      for (const c of corners) {
        const angles = [0.22, 0.5, 0.78, 1.06, 1.34];
        for (const a of angles) {
          const r1 = 1.6 * u;
          const r2 = (a === 0.78 ? 5.2 : 4.1) * u;
          const x1 = c.cx + c.sx * Math.cos(a) * r1;
          const y1 = c.cy + c.sy * Math.sin(a) * r1;
          const x2 = c.cx + c.sx * Math.cos(a) * r2;
          const y2 = c.cy + c.sy * Math.sin(a) * r2;
          thinStrokePaths.push(`M ${f(x1)} ${f(y1)} L ${f(x2)} ${f(y2)}`);
        }
        fillPaths.push(fourPointStarPath(c.cx + c.sx * 1.9 * u, c.cy + c.sy * 1.9 * u, 1.35 * u, 0.5 * u));
      }
      fillPaths.push(diamondPath(x + w / 2, y, 1.4 * u, 0.75 * u));
      fillPaths.push(diamondPath(x + w / 2, y + h, 1.4 * u, 0.75 * u));
      fillPaths.push(fourPointStarPath(x, y + h / 2, 1.3 * u, 0.45 * u));
      fillPaths.push(fourPointStarPath(x + w, y + h / 2, 1.3 * u, 0.45 * u));
      break;
    }

    case 'relic': {
      // BG3 Story / Artifact: Heavy octagonal relic frame with concentric runic seal rings.
      const ch = 3.4 * u;
      strokePaths.push(chamferedRectPath(x, y, w, h, ch));
      thinStrokePaths.push(
        chamferedRectPath(x + 1.05 * u, y + 1.05 * u, w - 2.1 * u, h - 2.1 * u, ch - 0.5 * u)
      );
      for (const c of corners) {
        const rcx = c.cx + c.sx * 2.5 * u;
        const rcy = c.cy + c.sy * 2.5 * u;
        thinStrokePaths.push(circlePath(rcx, rcy, 1.65 * u));
        thinStrokePaths.push(circlePath(rcx, rcy, 1.05 * u));
        fillPaths.push(diamondPath(rcx, rcy, 0.65 * u, 0.65 * u));
      }
      for (const side of [
        { sx: x, dir: 1 },
        { sx: x + w, dir: -1 },
      ]) {
        const my = y + h / 2;
        thinStrokePaths.push(
          `M ${f(side.sx)} ${f(my - 2.5 * u)} L ${f(side.sx + side.dir * 1.6 * u)} ${f(my)} L ${f(side.sx)} ${f(my + 2.5 * u)}`
        );
        fillPaths.push(circlePath(side.sx + side.dir * 0.5 * u, my, 0.55 * u));
      }
      break;
    }
  }

  return {
    strokePaths,
    thinStrokePaths,
    fillPaths,
    strokeWidthMm: 0.45 * u,
    thinStrokeWidthMm: 0.24 * u,
  };
};

/**
 * Ornamental frame drawn around a parchment panel (`window` on Shirt, `name`
 * plaque and `frame` text box on Description).
 */
export const buildPanelFrame = (
  rect: RectMm,
  pattern: ObjectFramePattern,
  variant: 'window' | 'plate' | 'body'
): FrameVectorSpec => {
  const { x, y, width: w, height: h } = rect;
  const u = w / 58.67;
  const strokePaths: string[] = [];
  const thinStrokePaths: string[] = [];
  const fillPaths: string[] = [];

  const isPlate = variant === 'plate';
  const inset = (isPlate ? 0.85 : 1.15) * u;
  const ix = x + inset;
  const iy = y + inset;
  const iw = w - 2 * inset;
  const ih = h - 2 * inset;

  const corners: Array<{ cx: number; cy: number; sx: number; sy: number }> = [
    { cx: ix, cy: iy, sx: 1, sy: 1 },
    { cx: ix + iw, cy: iy, sx: -1, sy: 1 },
    { cx: ix + iw, cy: iy + ih, sx: -1, sy: -1 },
    { cx: ix, cy: iy + ih, sx: 1, sy: -1 },
  ];

  switch (pattern) {
    case 'forged': {
      const ch = (isPlate ? 1.5 : 2.2) * u;
      strokePaths.push(chamferedRectPath(x, y, w, h, ch));
      thinStrokePaths.push(chamferedRectPath(ix, iy, iw, ih, ch * 0.75));
      for (const c of corners) {
        fillPaths.push(
          circlePath(c.cx + c.sx * 1.2 * u, c.cy + c.sy * 1.2 * u, (isPlate ? 0.35 : 0.45) * u)
        );
      }
      break;
    }

    case 'botanic': {
      const ch = (isPlate ? 1.4 : 2.0) * u;
      strokePaths.push(chamferedRectPath(x, y, w, h, ch));
      thinStrokePaths.push(steppedKnotRectPath(ix, iy, iw, ih, (isPlate ? 1.4 : 2.1) * u));
      for (const c of corners) {
        const d = (isPlate ? 0.9 : 1.3) * u;
        fillPaths.push(diamondPath(c.cx + c.sx * d, c.cy + c.sy * d, (isPlate ? 0.45 : 0.6) * u));
      }
      break;
    }

    case 'arcane': {
      const ch = (isPlate ? 1.5 : 2.2) * u;
      strokePaths.push(chamferedRectPath(x, y, w, h, ch));
      thinStrokePaths.push(chamferedRectPath(ix, iy, iw, ih, ch * 1.2));
      for (const c of corners) {
        const L = (isPlate ? 2.4 : 3.8) * u;
        thinStrokePaths.push(
          `M ${f(c.cx + c.sx * L)} ${f(c.cy)} L ${f(c.cx)} ${f(c.cy + c.sy * L)}`
        );
        fillPaths.push(
          fourPointStarPath(
            c.cx + c.sx * (isPlate ? 1.1 : 1.5) * u,
            c.cy + c.sy * (isPlate ? 1.1 : 1.5) * u,
            (isPlate ? 0.65 : 0.9) * u,
            (isPlate ? 0.24 : 0.34) * u
          )
        );
      }
      break;
    }

    case 'gothic': {
      const cr = (isPlate ? 1.6 : 2.5) * u;
      strokePaths.push(concaveCornerRectPath(x, y, w, h, cr * 0.7));
      thinStrokePaths.push(concaveCornerRectPath(ix, iy, iw, ih, cr));
      for (const c of corners) {
        const arm = (isPlate ? 2.6 : 4.2) * u;
        thinStrokePaths.push(
          `M ${f(c.cx + c.sx * arm)} ${f(c.cy + c.sy * 0.5 * u)} L ${f(c.cx + c.sx * 0.5 * u)} ${f(c.cy + c.sy * arm)}`
        );
        fillPaths.push(
          diamondPath(
            c.cx + c.sx * (isPlate ? 1.2 : 1.7) * u,
            c.cy + c.sy * (isPlate ? 1.2 : 1.7) * u,
            (isPlate ? 0.5 : 0.7) * u
          )
        );
      }
      break;
    }

    case 'royal': {
      const ch = (isPlate ? 1.5 : 2.2) * u;
      strokePaths.push(chamferedRectPath(x, y, w, h, ch));
      thinStrokePaths.push(steppedKnotRectPath(ix, iy, iw, ih, (isPlate ? 1.6 : 2.4) * u));
      for (const c of corners) {
        const rays = isPlate ? [0.4, 0.785, 1.17] : [0.3, 0.62, 0.95, 1.27];
        for (const a of rays) {
          const r1 = (isPlate ? 0.9 : 1.3) * u;
          const r2 = (isPlate ? 2.3 : 3.6) * u;
          thinStrokePaths.push(
            `M ${f(c.cx + c.sx * Math.cos(a) * r1)} ${f(c.cy + c.sy * Math.sin(a) * r1)} L ${f(c.cx + c.sx * Math.cos(a) * r2)} ${f(c.cy + c.sy * Math.sin(a) * r2)}`
          );
        }
        fillPaths.push(
          fourPointStarPath(
            c.cx + c.sx * (isPlate ? 0.9 : 1.2) * u,
            c.cy + c.sy * (isPlate ? 0.9 : 1.2) * u,
            (isPlate ? 0.65 : 0.85) * u,
            0.28 * u
          )
        );
      }
      break;
    }

    case 'relic': {
      const ch = (isPlate ? 1.7 : 2.5) * u;
      strokePaths.push(chamferedRectPath(x, y, w, h, ch));
      thinStrokePaths.push(chamferedRectPath(ix, iy, iw, ih, ch * 0.8));
      for (const c of corners) {
        const rcx = c.cx + c.sx * (isPlate ? 1.2 : 1.7) * u;
        const rcy = c.cy + c.sy * (isPlate ? 1.2 : 1.7) * u;
        thinStrokePaths.push(circlePath(rcx, rcy, (isPlate ? 0.75 : 1.1) * u));
        fillPaths.push(circlePath(rcx, rcy, (isPlate ? 0.32 : 0.45) * u));
      }
      break;
    }
  }

  if (isPlate) {
    const cy = y + h / 2;
    fillPaths.push(diamondPath(x + 1.9 * u, cy, 0.7 * u, 0.5 * u));
    fillPaths.push(diamondPath(x + w - 1.9 * u, cy, 0.7 * u, 0.5 * u));
  }

  return {
    strokePaths,
    thinStrokePaths,
    fillPaths,
    strokeWidthMm: 0.42 * u,
    thinStrokeWidthMm: 0.22 * u,
  };
};

/**
 * Ornamental wings and rarity emblems flanking the subtitle band (`zones.label`)
 * between the name plate and the description frame.
 */
export const buildRarityDivider = (
  labelRect: RectMm,
  pattern: ObjectFramePattern
): FrameVectorSpec => {
  const u = labelRect.width / 58.67;
  const cy = labelRect.y + labelRect.height / 2;
  const leftStart = labelRect.x + 1.0 * u;
  const rightEnd = labelRect.x + labelRect.width - 1.0 * u;
  const wingLen = labelRect.width * 0.17;
  const leftEnd = leftStart + wingLen;
  const rightStart = rightEnd - wingLen;

  const strokePaths: string[] = [
    `M ${f(leftStart)} ${f(cy)} L ${f(leftEnd - 1.2 * u)} ${f(cy)}`,
    `M ${f(rightStart + 1.2 * u)} ${f(cy)} L ${f(rightEnd)} ${f(cy)}`,
  ];
  const thinStrokePaths: string[] = [];
  const fillPaths: string[] = [];

  for (const gx of [leftEnd, rightStart]) {
    switch (pattern) {
      case 'forged':
        fillPaths.push(diamondPath(gx, cy, 0.75 * u, 0.5 * u));
        break;
      case 'botanic':
        fillPaths.push(diamondPath(gx, cy, 0.85 * u, 0.55 * u));
        fillPaths.push(circlePath(gx + (gx === leftEnd ? -1.4 : 1.4) * u, cy, 0.32 * u));
        break;
      case 'arcane':
        fillPaths.push(fourPointStarPath(gx, cy, 1.0 * u, 0.35 * u));
        break;
      case 'gothic':
        fillPaths.push(diamondPath(gx, cy, 0.9 * u, 0.6 * u));
        fillPaths.push(circlePath(gx, cy - 0.75 * u, 0.28 * u));
        fillPaths.push(circlePath(gx, cy + 0.75 * u, 0.28 * u));
        break;
      case 'royal':
        fillPaths.push(fourPointStarPath(gx, cy, 1.15 * u, 0.42 * u));
        fillPaths.push(diamondPath(gx + (gx === leftEnd ? -1.7 : 1.7) * u, cy, 0.55 * u, 0.4 * u));
        break;
      case 'relic':
        thinStrokePaths.push(circlePath(gx, cy, 0.85 * u));
        fillPaths.push(diamondPath(gx, cy, 0.48 * u, 0.48 * u));
        break;
    }
  }

  return {
    strokePaths,
    thinStrokePaths,
    fillPaths,
    strokeWidthMm: 0.3 * u,
    thinStrokeWidthMm: 0.2 * u,
  };
};

/**
 * Centered background watermark crest inside the description frame so short or
 * empty descriptions still look like authentic illustrated RPG item cards.
 */
export const buildRarityWatermark = (
  frameRect: RectMm,
  pattern: ObjectFramePattern
): FrameVectorSpec => {
  const u = frameRect.width / 58.67;
  const cx = frameRect.x + frameRect.width / 2;
  const cy = frameRect.y + frameRect.height * 0.52;
  const r = Math.min(frameRect.width, frameRect.height) * 0.23;

  const strokePaths: string[] = [];
  const thinStrokePaths: string[] = [];
  const fillPaths: string[] = [];

  switch (pattern) {
    case 'forged': {
      strokePaths.push(
        `M ${f(cx)} ${f(cy - r)} L ${f(cx + r * 0.78)} ${f(cy - r * 0.55)} L ${f(cx + r * 0.68)} ${f(cy + r * 0.35)} L ${f(cx)} ${f(cy + r)} L ${f(cx - r * 0.68)} ${f(cy + r * 0.35)} L ${f(cx - r * 0.78)} ${f(cy - r * 0.55)} Z`
      );
      thinStrokePaths.push(diamondPath(cx, cy, r * 0.42, r * 0.55));
      break;
    }
    case 'botanic': {
      strokePaths.push(circlePath(cx, cy, r * 0.78));
      thinStrokePaths.push(diamondPath(cx, cy, r, r * 0.55));
      thinStrokePaths.push(diamondPath(cx, cy, r * 0.55, r));
      fillPaths.push(diamondPath(cx, cy, r * 0.22, r * 0.22));
      break;
    }
    case 'arcane': {
      strokePaths.push(circlePath(cx, cy, r * 0.88));
      thinStrokePaths.push(circlePath(cx, cy, r * 0.68));
      thinStrokePaths.push(fourPointStarPath(cx, cy, r * 0.95, r * 0.35));
      thinStrokePaths.push(diamondPath(cx, cy, r * 0.62, r * 0.62));
      break;
    }
    case 'gothic': {
      strokePaths.push(diamondPath(cx, cy, r * 0.75, r));
      thinStrokePaths.push(circlePath(cx, cy, r * 0.62));
      thinStrokePaths.push(fourPointStarPath(cx, cy, r * 0.82, r * 0.28));
      fillPaths.push(circlePath(cx, cy, r * 0.14));
      break;
    }
    case 'royal': {
      strokePaths.push(circlePath(cx, cy, r * 0.65));
      thinStrokePaths.push(circlePath(cx, cy, r * 0.48));
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        const r1 = r * 0.68;
        const r2 = i % 2 === 0 ? r * 1.04 : r * 0.86;
        thinStrokePaths.push(
          `M ${f(cx + Math.cos(a) * r1)} ${f(cy + Math.sin(a) * r1)} L ${f(cx + Math.cos(a) * r2)} ${f(cy + Math.sin(a) * r2)}`
        );
      }
      fillPaths.push(fourPointStarPath(cx, cy, r * 0.42, r * 0.16));
      break;
    }
    case 'relic': {
      strokePaths.push(circlePath(cx, cy, r * 0.9));
      thinStrokePaths.push(circlePath(cx, cy, r * 0.74));
      thinStrokePaths.push(
        `M ${f(cx - r * 0.7)} ${f(cy)} Q ${f(cx)} ${f(cy - r * 0.48)} ${f(cx + r * 0.7)} ${f(cy)} Q ${f(cx)} ${f(cy + r * 0.48)} ${f(cx - r * 0.7)} ${f(cy)} Z`
      );
      thinStrokePaths.push(circlePath(cx, cy, r * 0.24));
      fillPaths.push(diamondPath(cx, cy, r * 0.12, r * 0.2));
      break;
    }
  }

  return {
    strokePaths,
    thinStrokePaths,
    fillPaths,
    strokeWidthMm: 0.38 * u,
    thinStrokeWidthMm: 0.24 * u,
  };
};

/**
 * Small book-style tailpiece flourish drawn beneath short descriptions so the
 * lower half of the text box feels intentionally composed.
 */
export const buildTailpieceFlourish = (
  cx: number,
  y: number,
  widthMm: number,
  pattern: ObjectFramePattern
): FrameVectorSpec => {
  const u = widthMm / 52.67;
  const half = widthMm * 0.28;
  const strokePaths = [
    `M ${f(cx - half)} ${f(y)} L ${f(cx - 2.2 * u)} ${f(y)}`,
    `M ${f(cx + 2.2 * u)} ${f(y)} L ${f(cx + half)} ${f(y)}`,
  ];
  const fillPaths: string[] = [];

  if (pattern === 'royal' || pattern === 'arcane') {
    fillPaths.push(fourPointStarPath(cx, y, 1.25 * u, 0.45 * u));
  } else {
    fillPaths.push(diamondPath(cx, y, 1.1 * u, 0.7 * u));
  }
  fillPaths.push(circlePath(cx - 2.6 * u, y, 0.35 * u));
  fillPaths.push(circlePath(cx + 2.6 * u, y, 0.35 * u));

  return {
    strokePaths,
    thinStrokePaths: [],
    fillPaths,
    strokeWidthMm: 0.26 * u,
    thinStrokeWidthMm: 0.2 * u,
  };
};

/**
 * Fine ornamental divider separating the body text from the BG3 stats bar at
 * the bottom of the description frame.
 */
export const buildStatsDivider = (
  frameRect: RectMm,
  statsTopY: number,
  pattern: ObjectFramePattern
): FrameVectorSpec => {
  const u = frameRect.width / 58.67;
  const cx = frameRect.x + frameRect.width / 2;
  const left = frameRect.x + frameRect.width * 0.06;
  const right = frameRect.x + frameRect.width * 0.94;
  const gap = 1.6 * u;

  const thinStrokePaths = [
    `M ${f(left)} ${f(statsTopY)} L ${f(cx - gap)} ${f(statsTopY)}`,
    `M ${f(cx + gap)} ${f(statsTopY)} L ${f(right)} ${f(statsTopY)}`,
  ];
  const fillPaths: string[] = [
    pattern === 'royal' || pattern === 'arcane'
      ? fourPointStarPath(cx, statsTopY, 0.95 * u, 0.35 * u)
      : diamondPath(cx, statsTopY, 0.85 * u, 0.55 * u),
  ];

  return {
    strokePaths: [],
    thinStrokePaths,
    fillPaths,
    strokeWidthMm: 0.25 * u,
    thinStrokeWidthMm: 0.2 * u,
  };
};

/**
 * Vector icon for a BG3 item property tag (`stat`, `weight`, `price`, `attunement`).
 */
export const buildStatIconSpec = (
  kind: ObjectStatKind,
  cx: number,
  cy: number,
  r: number
): FrameVectorSpec => {
  const strokePaths: string[] = [];
  const thinStrokePaths: string[] = [];
  const fillPaths: string[] = [];

  switch (kind) {
    case 'stat': {
      // Crossed sword / combat crest diamond
      fillPaths.push(
        `M ${f(cx)} ${f(cy - r)} L ${f(cx + r * 0.32)} ${f(cy - r * 0.18)} L ${f(cx + r * 0.88)} ${f(cy - r * 0.18)} L ${f(cx + r * 0.32)} ${f(cy + r * 0.12)} L ${f(cx)} ${f(cy + r)} L ${f(cx - r * 0.32)} ${f(cy + r * 0.12)} L ${f(cx - r * 0.88)} ${f(cy - r * 0.18)} L ${f(cx - r * 0.32)} ${f(cy - r * 0.18)} Z`
      );
      break;
    }
    case 'weight': {
      // Classic scale weight (kettlebell trapezoid + top ring)
      thinStrokePaths.push(circlePath(cx, cy - r * 0.52, r * 0.3));
      fillPaths.push(
        `M ${f(cx - r * 0.52)} ${f(cy - r * 0.22)} L ${f(cx + r * 0.52)} ${f(cy - r * 0.22)} L ${f(cx + r * 0.82)} ${f(cy + r * 0.85)} L ${f(cx - r * 0.82)} ${f(cy + r * 0.85)} Z`
      );
      break;
    }
    case 'price': {
      // Gold coin with inner gem
      strokePaths.push(circlePath(cx, cy, r * 0.85));
      fillPaths.push(diamondPath(cx, cy, r * 0.42, r * 0.42));
      break;
    }
    case 'attunement': {
      // Arcane four-point star with outer halo
      thinStrokePaths.push(circlePath(cx, cy, r * 0.72));
      fillPaths.push(fourPointStarPath(cx, cy, r * 0.95, r * 0.34));
      break;
    }
  }

  return {
    strokePaths,
    thinStrokePaths,
    fillPaths,
    strokeWidthMm: r * 0.22,
    thinStrokeWidthMm: r * 0.18,
  };
};

/**
 * Unrolled parchment banner with left/right vertical cylindrical spindles and
 * finials. Everything stays strictly inside `scrollRect` (`scrollRect.x ..
 * scrollRect.x + scrollRect.width`), so spindles never protrude past the card.
 */
export const buildScrollVector = (scrollRect: RectMm): ScrollVectorSpec => {
  const { x, y, width, height } = scrollRect;
  const rollerWidth = Math.min(width * 0.085, height * 0.3);
  const capHeight = height * 0.09;
  const bannerInsetY = height * 0.07;

  const leftRoller: RectMm = {
    x,
    y: y + capHeight * 0.6,
    width: rollerWidth,
    height: height - capHeight * 1.2,
  };

  const rightRoller: RectMm = {
    x: x + width - rollerWidth,
    y: y + capHeight * 0.6,
    width: rollerWidth,
    height: height - capHeight * 1.2,
  };

  const banner: RectMm = {
    x: x + rollerWidth * 0.75,
    y: y + bannerInsetY,
    width: width - rollerWidth * 1.5,
    height: height - bannerInsetY * 2,
  };

  const capW = rollerWidth * 0.72;
  const capOffsetX = (rollerWidth - capW) / 2;
  const caps: RectMm[] = [
    { x: leftRoller.x + capOffsetX, y, width: capW, height: capHeight },
    { x: leftRoller.x + capOffsetX, y: y + height - capHeight, width: capW, height: capHeight },
    { x: rightRoller.x + capOffsetX, y, width: capW, height: capHeight },
    { x: rightRoller.x + capOffsetX, y: y + height - capHeight, width: capW, height: capHeight },
  ];

  const ruleInsetX = banner.x + rollerWidth * 0.45;
  const ruleEndX = banner.x + banner.width - rollerWidth * 0.45;
  const topRuleY = banner.y + banner.height * 0.09;
  const bottomRuleY = banner.y + banner.height * 0.91;

  const rulePaths: string[] = [
    `M ${f(ruleInsetX)} ${f(topRuleY)} L ${f(ruleEndX)} ${f(topRuleY)}`,
    `M ${f(ruleInsetX)} ${f(bottomRuleY)} L ${f(ruleEndX)} ${f(bottomRuleY)}`,
  ];

  const textPadX = rollerWidth * 0.65;
  const textPadY = banner.height * 0.16;

  return {
    banner,
    leftRoller,
    rightRoller,
    caps,
    rulePaths,
    textBox: {
      x: banner.x + textPadX,
      y: banner.y + textPadY,
      width: banner.width - textPadX * 2,
      height: banner.height - textPadY * 2,
    },
  };
};

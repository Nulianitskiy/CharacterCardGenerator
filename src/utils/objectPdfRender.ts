/**
 * Canvas rasterizers for object-card faces (shirt + description).
 *
 * All placement comes from `objectLayout.ts` zones (millimeters) scaled by
 * `PRINT_PX_PER_MM`, all colors from `OBJECT_PALETTES`, and all ornamental
 * frames/dividers/scrolls/watermarks/stat-icons from `objectFrames.ts` — the
 * screen preview renders the exact same vector paths via SVG.
 */

import type { NameFontValue } from '../types';
import {
  OBJECT_BADGE_FONT_MM,
  OBJECT_LABEL_FONT_MM,
  OBJECT_LINE_HEIGHT_FACTOR,
  OBJECT_MIN_FONT_FRACTION,
  OBJECT_NAME_FONT_MM,
  OBJECT_PALETTES,
  OBJECT_SLOGAN_FONT_MM,
  OBJECT_STAT_FONT_MM,
  OBJECT_TEXT_FONT_MM,
  PRINT_PX_PER_MM,
  getGameObjectCellHeight,
  getGameObjectCellWidth,
  type ObjectPalette,
} from '../constants';
import type { GameObject } from '../types';
import { get2dContext } from './canvas2d';
import { getCanvasFont } from './nameFont';
import { layoutImageFill } from './imageFillLayout';
import { fitJustifiedText, justifyLine } from './justifiedText';
import type { MarkedLine } from './justifiedText';
import {
  buildCardOuterFrame,
  buildPanelFrame,
  buildRarityDivider,
  buildRarityWatermark,
  buildScrollVector,
  buildStatIconSpec,
  buildStatsDivider,
  buildTailpieceFlourish,
  type FrameVectorSpec,
} from './objectFrames';
import {
  descriptionZones,
  getObjectStatChips,
  layoutObjectStatChips,
  shirtZones,
} from './objectLayout';
import type { RectMm } from './pdfLayout';
import type { PrintImage } from './printImage';

/** Object cards use a fixed print-oriented serif, independent of name settings. */
const OBJECT_FONT: NameFontValue = 'medieval';

const SCALE = PRINT_PX_PER_MM;

export const objectFaceSizePx = (): { width: number; height: number } => ({
  width: Math.round(getGameObjectCellWidth() * SCALE),
  height: Math.round(getGameObjectCellHeight() * SCALE),
});

/** Print box for the shirt image window — loadPrintImage target size. */
export const objectShirtImagePrintSizePx = (): { width: number; height: number } => {
  const zones = shirtZones(objectFaceRectMm(), false);
  return {
    width: Math.max(1, Math.round(zones.image.width * SCALE)),
    height: Math.max(1, Math.round(zones.image.height * SCALE)),
  };
};

const objectFaceRectMm = (): RectMm => ({
  x: 0,
  y: 0,
  width: getGameObjectCellWidth(),
  height: getGameObjectCellHeight(),
});

const toPx = (rect: RectMm): RectMm => ({
  x: rect.x * SCALE,
  y: rect.y * SCALE,
  width: rect.width * SCALE,
  height: rect.height * SCALE,
});

const roundRectPath = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void => {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
};

const fillPaperPanel = (
  ctx: CanvasRenderingContext2D,
  rect: RectMm,
  palette: ObjectPalette,
  radiusFraction = 0.05
): void => {
  const r = Math.min(rect.width, rect.height) * radiusFraction;
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.height);
  grad.addColorStop(0, palette.paper);
  grad.addColorStop(0.85, palette.paper);
  grad.addColorStop(1, palette.paperDark);
  ctx.fillStyle = grad;
  roundRectPath(ctx, rect.x, rect.y, rect.width, rect.height, r);
  ctx.fill();
};

/** Draws a millimeter-space `FrameVectorSpec` onto the scaled canvas. */
const drawFrameVector = (
  ctx: CanvasRenderingContext2D,
  spec: FrameVectorSpec,
  strokeColor: string,
  thinColor: string,
  fillColor: string,
  alpha = 1
): void => {
  ctx.save();
  ctx.scale(SCALE, SCALE);
  ctx.globalAlpha = alpha;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (spec.strokePaths.length > 0) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = spec.strokeWidthMm;
    for (const d of spec.strokePaths) {
      ctx.stroke(new Path2D(d));
    }
  }

  if (spec.thinStrokePaths.length > 0) {
    ctx.strokeStyle = thinColor;
    ctx.lineWidth = spec.thinStrokeWidthMm;
    for (const d of spec.thinStrokePaths) {
      ctx.stroke(new Path2D(d));
    }
  }

  if (spec.fillPaths.length > 0) {
    ctx.fillStyle = fillColor;
    for (const d of spec.fillPaths) {
      ctx.fill(new Path2D(d));
    }
  }

  ctx.restore();
};

const canvasMeasure = (ctx: CanvasRenderingContext2D) => (fontSize: number) => (text: string): number => {
  ctx.font = getCanvasFont(OBJECT_FONT, fontSize);
  return ctx.measureText(text).width;
};

/** Centered, shrink-to-fit text block (names, slogan, badge digits). */
const drawCenteredFit = (
  ctx: CanvasRenderingContext2D,
  text: string,
  rect: RectMm,
  baseFontSizePx: number,
  color: string,
  minFraction = OBJECT_MIN_FONT_FRACTION,
  withShadow = false
): void => {
  const trimmed = text.trim();
  if (!trimmed || rect.width <= 0 || rect.height <= 0) return;

  const fit = fitJustifiedText({
    text: trimmed,
    width: rect.width,
    height: rect.height,
    baseFontSize: baseFontSizePx,
    minFontSize: baseFontSizePx * minFraction,
    lineHeightFactor: 1.14,
    makeMeasure: canvasMeasure(ctx),
  });

  ctx.save();
  ctx.font = getCanvasFont(OBJECT_FONT, fit.fontSize);
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (withShadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 2.5;
    ctx.shadowOffsetY = 1.2;
  }

  const total = fit.lines.length * fit.lineHeight;
  const startY = rect.y + (rect.height - total) / 2 + fit.lineHeight / 2;
  fit.lines.forEach((line, index) => {
    ctx.fillText(line.text, rect.x + rect.width / 2, startY + index * fit.lineHeight);
  });
  ctx.restore();
};

/** Single-line left-aligned shrink-to-fit text for BG3 stat chips. */
const drawLeftSingleFit = (
  ctx: CanvasRenderingContext2D,
  text: string,
  rect: RectMm,
  baseFontSizePx: number,
  color: string
): void => {
  const trimmed = text.trim();
  if (!trimmed || rect.width <= 0 || rect.height <= 0) return;

  let fontSize = baseFontSizePx;
  const minFontSize = baseFontSizePx * 0.58;
  while (fontSize > minFontSize) {
    ctx.font = getCanvasFont(OBJECT_FONT, fontSize);
    if (ctx.measureText(trimmed).width <= rect.width) break;
    fontSize -= 0.5;
  }

  ctx.save();
  ctx.font = getCanvasFont(OBJECT_FONT, fontSize);
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(trimmed, rect.x, rect.y + rect.height / 2, rect.width);
  ctx.restore();
};

const drawCardBase = (
  ctx: CanvasRenderingContext2D,
  size: { width: number; height: number },
  palette: ObjectPalette
): void => {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size.width, size.height);

  const grad = ctx.createRadialGradient(
    size.width * 0.5,
    size.height * 0.28,
    size.width * 0.05,
    size.width * 0.5,
    size.height * 0.5,
    size.height * 0.72
  );
  grad.addColorStop(0, palette.cardBgLight);
  grad.addColorStop(1, palette.cardBg);

  ctx.fillStyle = grad;
  roundRectPath(ctx, 0, 0, size.width, size.height, size.width * 0.05);
  ctx.fill();

  const outerFrame = buildCardOuterFrame(
    getGameObjectCellWidth(),
    getGameObjectCellHeight(),
    palette.pattern
  );
  drawFrameVector(ctx, outerFrame, palette.accent, palette.accent, palette.accent, 0.88);
};

const toDataUrl = (canvas: HTMLCanvasElement): string => canvas.toDataURL('image/jpeg', 0.94);

/**
 * Shirt face: name on the colored card, unified paper window with rarity
 * frame, item image, ornate scroll (when slogan is non-empty) and optional
 * quantity medallion.
 */
export const renderShirtFace = (object: GameObject, image: PrintImage | null): string => {
  const size = objectFaceSizePx();
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = get2dContext(canvas);
  const palette = OBJECT_PALETTES[object.theme];
  const u = getGameObjectCellWidth() / 66.67;

  drawCardBase(ctx, size, palette);

  const zones = shirtZones(objectFaceRectMm(), object.slogan.trim() !== '');
  const name = toPx({
    x: zones.name.x + 2.4 * u,
    y: zones.name.y + 0.8 * u,
    width: zones.name.width - 4.8 * u,
    height: zones.name.height - 1.6 * u,
  });
  const windowPx = toPx(zones.window);
  const imageRect = toPx(zones.image);

  // Unified paper window from below the name band to the bottom inset.
  fillPaperPanel(ctx, windowPx, palette, 0.055);

  if (image) {
    const clipInset = 1.35 * u * SCALE;
    const clipRect: RectMm = {
      x: imageRect.x + clipInset,
      y: imageRect.y + clipInset,
      width: Math.max(1, imageRect.width - clipInset * 2),
      height: Math.max(1, imageRect.height - clipInset),
    };
    ctx.save();
    roundRectPath(ctx, clipRect.x, clipRect.y, clipRect.width, clipRect.height, clipRect.width * 0.035);
    ctx.clip();
    const fillMode = object.imageFillMode ?? 'cover';
    const layout = layoutImageFill(
      fillMode,
      clipRect.width,
      clipRect.height,
      image.width,
      image.height,
      object.imageFocus
    );
    ctx.drawImage(
      image,
      clipRect.x + layout.left,
      clipRect.y + layout.top,
      layout.width,
      layout.height
    );
    ctx.restore();
  }

  // Ornamental rarity frame around the paper window.
  const windowFrame = buildPanelFrame(zones.window, palette.pattern, 'window');
  drawFrameVector(ctx, windowFrame, palette.frame, palette.accent, palette.frame, 0.95);

  // Slogan scroll: unrolled parchment banner with vertical cylindrical spindles.
  if (zones.scroll) {
    const scrollVec = buildScrollVector(zones.scroll);
    const bannerPx = toPx(scrollVec.banner);
    const leftRollerPx = toPx(scrollVec.leftRoller);
    const rightRollerPx = toPx(scrollVec.rightRoller);

    ctx.fillStyle = palette.frame;
    for (const cap of scrollVec.caps) {
      const capPx = toPx(cap);
      roundRectPath(ctx, capPx.x, capPx.y, capPx.width, capPx.height, capPx.width * 0.35);
      ctx.fill();
    }

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1.5;
    fillPaperPanel(ctx, bannerPx, palette, 0.08);
    ctx.restore();

    ctx.strokeStyle = palette.frame;
    ctx.lineWidth = Math.max(1.2, 0.32 * u * SCALE);
    roundRectPath(ctx, bannerPx.x, bannerPx.y, bannerPx.width, bannerPx.height, bannerPx.height * 0.08);
    ctx.stroke();

    drawFrameVector(
      ctx,
      {
        strokePaths: [],
        thinStrokePaths: scrollVec.rulePaths,
        fillPaths: [],
        strokeWidthMm: 0.3 * u,
        thinStrokeWidthMm: 0.2 * u,
      },
      palette.frame,
      palette.accent,
      palette.frame,
      0.85
    );

    for (const rollerPx of [leftRollerPx, rightRollerPx]) {
      const rGrad = ctx.createLinearGradient(
        rollerPx.x,
        rollerPx.y,
        rollerPx.x + rollerPx.width,
        rollerPx.y
      );
      rGrad.addColorStop(0, palette.frame);
      rGrad.addColorStop(0.42, palette.accent);
      rGrad.addColorStop(1, palette.frame);
      ctx.fillStyle = rGrad;
      roundRectPath(ctx, rollerPx.x, rollerPx.y, rollerPx.width, rollerPx.height, rollerPx.width * 0.38);
      ctx.fill();
      ctx.strokeStyle = palette.frame;
      ctx.lineWidth = Math.max(1, 0.26 * u * SCALE);
      ctx.stroke();
    }

    drawCenteredFit(
      ctx,
      object.slogan,
      toPx(scrollVec.textBox),
      OBJECT_SLOGAN_FONT_MM * SCALE,
      palette.ink,
      0.55
    );
  }

  // Name band over the card background.
  drawCenteredFit(ctx, object.name, name, OBJECT_NAME_FONT_MM * SCALE, palette.onCardBg, 0.5, true);

  // Quantity medallion in the top-right corner of the window.
  if (object.quantity !== null && Number.isFinite(object.quantity)) {
    const badge = zones.badge;
    const cx = badge.cx * SCALE;
    const cy = badge.cy * SCALE;
    const r = badge.r * SCALE;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.32)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1.5;
    const bGrad = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, r * 0.1, cx, cy, r);
    bGrad.addColorStop(0, palette.paper);
    bGrad.addColorStop(0.35, palette.accent);
    bGrad.addColorStop(1, palette.accent);
    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = palette.frame;
    ctx.lineWidth = Math.max(1.8, r * 0.13);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = palette.paper;
    ctx.lineWidth = Math.max(1, r * 0.05);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
    ctx.stroke();

    drawCenteredFit(
      ctx,
      String(Math.max(0, Math.round(object.quantity))),
      { x: cx - r * 0.68, y: cy - r * 0.58, width: r * 1.36, height: r * 1.16 },
      OBJECT_BADGE_FONT_MM * SCALE,
      palette.ink,
      0.65
    );
  }

  return toDataUrl(canvas);
};

/**
 * Description face: paper name plaque with rarity filigree, rarity subtitle
 * divider and justified text frame with watermark crest, tailpiece & BG3 stat
 * tags.
 */
export const renderDescriptionFace = (object: GameObject): string => {
  const size = objectFaceSizePx();
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = get2dContext(canvas);
  const palette = OBJECT_PALETTES[object.theme];
  const u = getGameObjectCellWidth() / 66.67;

  drawCardBase(ctx, size, palette);

  const statChips = getObjectStatChips(object);
  const zones = descriptionZones(objectFaceRectMm(), statChips.length);
  const name = toPx(zones.name);
  const nameInner = toPx({
    x: zones.name.x + 3.2 * u,
    y: zones.name.y + 1.4 * u,
    width: zones.name.width - 6.4 * u,
    height: zones.name.height - 2.8 * u,
  });
  const label = toPx(zones.label);
  const frame = toPx(zones.frame);
  const text = toPx(zones.text);

  // Top name plaque + rarity frame
  fillPaperPanel(ctx, name, palette, 0.08);
  const plateFrame = buildPanelFrame(zones.name, palette.pattern, 'plate');
  drawFrameVector(ctx, plateFrame, palette.frame, palette.accent, palette.frame, 0.95);
  drawCenteredFit(ctx, object.name, nameInner, OBJECT_NAME_FONT_MM * SCALE, palette.ink, 0.5);

  // Rarity subtitle & divider wings
  const divider = buildRarityDivider(zones.label, palette.pattern);
  drawFrameVector(ctx, divider, palette.accent, palette.accent, palette.accent, 0.9);
  drawCenteredFit(
    ctx,
    palette.raritySubtitle,
    {
      x: label.x + label.width * 0.2,
      y: label.y,
      width: label.width * 0.6,
      height: label.height,
    },
    OBJECT_LABEL_FONT_MM * SCALE,
    palette.onCardBg,
    0.8,
    true
  );

  // Main description parchment panel + watermark crest + rarity border
  fillPaperPanel(ctx, frame, palette, 0.045);

  const watermark = buildRarityWatermark(zones.frame, palette.pattern);
  drawFrameVector(ctx, watermark, palette.frame, palette.frame, palette.frame, 0.085);

  const bodyFrame = buildPanelFrame(zones.frame, palette.pattern, 'body');
  drawFrameVector(ctx, bodyFrame, palette.frame, palette.accent, palette.frame, 0.95);

  const fit = fitJustifiedText({
    text: object.description,
    width: text.width,
    height: text.height,
    baseFontSize: OBJECT_TEXT_FONT_MM * SCALE,
    minFontSize: OBJECT_TEXT_FONT_MM * SCALE * OBJECT_MIN_FONT_FRACTION,
    lineHeightFactor: OBJECT_LINE_HEIGHT_FACTOR,
    makeMeasure: canvasMeasure(ctx),
  });

  drawJustifiedLines(ctx, fit.lines, text, fit.fontSize, fit.lineHeight, palette.ink);

  // Book-style tailpiece flourish below short descriptions
  const textHeightUsedMm = (fit.lines.length * fit.lineHeight) / SCALE;
  const remainingMm = zones.text.height - textHeightUsedMm;
  const minTailGap = 6.0 * u;
  if (fit.lines.length > 0 && !fit.overflow && remainingMm >= minTailGap) {
    const tailY = zones.text.y + textHeightUsedMm + Math.min(4.0 * u, remainingMm * 0.38);
    const tailpiece = buildTailpieceFlourish(
      getGameObjectCellWidth() / 2,
      tailY,
      zones.text.width,
      palette.pattern
    );
    drawFrameVector(ctx, tailpiece, palette.frame, palette.accent, palette.accent, 0.55);
  }

  // Optional BG3 item property tags footer bar
  if (zones.stats && statChips.length > 0) {
    const statsDivider = buildStatsDivider(zones.frame, zones.stats.y, palette.pattern);
    drawFrameVector(ctx, statsDivider, palette.frame, palette.frame, palette.accent, 0.75);

    const laidOutChips = layoutObjectStatChips(zones.stats, statChips);
    for (const chip of laidOutChips) {
      const iconSpec = buildStatIconSpec(chip.kind, chip.icon.cx, chip.icon.cy, chip.icon.r);
      drawFrameVector(ctx, iconSpec, palette.frame, palette.frame, palette.frame, 0.9);
      drawLeftSingleFit(
        ctx,
        chip.text,
        toPx(chip.textRect),
        OBJECT_STAT_FONT_MM * SCALE,
        palette.ink
      );
    }
  }

  return toDataUrl(canvas);
};

const drawJustifiedLines = (
  ctx: CanvasRenderingContext2D,
  lines: MarkedLine[],
  box: RectMm,
  fontSize: number,
  lineHeight: number,
  color: string
): void => {
  if (lines.length === 0) return;

  const measure = canvasMeasure(ctx)(fontSize);
  ctx.font = getCanvasFont(OBJECT_FONT, fontSize);
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  lines.forEach((line, index) => {
    const isLast = line.paragraphEnd || index === lines.length - 1;
    const { words, gapStretch } = justifyLine(line.text, box.width, measure, isLast);
    let x = box.x;
    words.forEach((word, wordIndex) => {
      ctx.fillText(word, x, box.y + index * lineHeight);
      x += measure(word) + (wordIndex < words.length - 1 ? gapStretch : 0);
    });
  });
};

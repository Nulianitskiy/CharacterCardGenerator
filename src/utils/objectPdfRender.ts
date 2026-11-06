/**
 * Canvas rasterizers for object-card faces (shirt + description).
 *
 * All placement comes from `objectLayout.ts` zones (millimeters) scaled by
 * `PRINT_PX_PER_MM`, and all colors from `OBJECT_PALETTES` — the screen
 * preview reads the same constants. Decorative plates (name band, image
 * window, scroll, badge, description frame) are vector primitives, so no
 * preset art files are needed.
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
import { descriptionZones, shirtZones } from './objectLayout';
import type { RectMm as RectPx } from './pdfLayout';
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
  const zones = shirtZones(objectFaceRectMm(), true);
  return {
    width: Math.max(1, Math.round(zones.image.width * SCALE)),
    height: Math.max(1, Math.round(zones.image.height * SCALE)),
  };
};

const objectFaceRectMm = (): RectPx => ({
  x: 0,
  y: 0,
  width: getGameObjectCellWidth(),
  height: getGameObjectCellHeight(),
});

const toPx = (rect: RectPx): RectPx => ({
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
  rect: RectPx,
  palette: ObjectPalette,
  radiusFraction = 0.08
): void => {
  ctx.fillStyle = palette.paper;
  roundRectPath(ctx, rect.x, rect.y, rect.width, rect.height, Math.min(rect.width, rect.height) * radiusFraction);
  ctx.fill();
};

const canvasMeasure = (ctx: CanvasRenderingContext2D) => (fontSize: number) => (text: string): number => {
  ctx.font = getCanvasFont(OBJECT_FONT, fontSize);
  return ctx.measureText(text).width;
};

/** Centered, shrink-to-fit text block (names, slogan, badge digits). */
const drawCenteredFit = (
  ctx: CanvasRenderingContext2D,
  text: string,
  rect: RectPx,
  baseFontSizePx: number,
  color: string,
  minFraction = OBJECT_MIN_FONT_FRACTION
): void => {
  const trimmed = text.trim();
  if (!trimmed || rect.width <= 0 || rect.height <= 0) return;

  const fit = fitJustifiedText({
    text: trimmed,
    width: rect.width,
    height: rect.height,
    baseFontSize: baseFontSizePx,
    minFontSize: baseFontSizePx * minFraction,
    lineHeightFactor: 1.15,
    makeMeasure: canvasMeasure(ctx),
  });

  ctx.font = getCanvasFont(OBJECT_FONT, fit.fontSize);
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const total = fit.lines.length * fit.lineHeight;
  const startY = rect.y + (rect.height - total) / 2 + fit.lineHeight / 2;
  fit.lines.forEach((line, index) => {
    ctx.fillText(line.text, rect.x + rect.width / 2, startY + index * fit.lineHeight);
  });
  ctx.textAlign = 'left';
};

const drawCardBase = (
  ctx: CanvasRenderingContext2D,
  size: { width: number; height: number },
  palette: ObjectPalette
): void => {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size.width, size.height);
  ctx.fillStyle = palette.cardBg;
  roundRectPath(
    ctx,
    0,
    0,
    size.width,
    size.height,
    size.width * 0.05
  );
  ctx.fill();
};

const toDataUrl = (canvas: HTMLCanvasElement): string => canvas.toDataURL('image/jpeg', 0.94);

/**
 * Shirt face: name on the colored card, paper image window, slogan scroll
 * (hidden for empty slogans) and the optional quantity badge.
 */
export const renderShirtFace = (object: GameObject, image: PrintImage | null): string => {
  const size = objectFaceSizePx();
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = get2dContext(canvas);
  const palette = OBJECT_PALETTES[object.theme];

  drawCardBase(ctx, size, palette);

  const zones = shirtZones(objectFaceRectMm(), object.slogan.trim() !== '');
  const name = toPx(zones.name);
  const imageRect = toPx(zones.image);
  const scroll = zones.scroll ? toPx(zones.scroll) : null;

  // Image window.
  fillPaperPanel(ctx, imageRect, palette, 0.1);
  if (image) {
    ctx.save();
    roundRectPath(
      ctx,
      imageRect.x,
      imageRect.y,
      imageRect.width,
      imageRect.height,
      Math.min(imageRect.width, imageRect.height) * 0.1
    );
    ctx.clip();
    const layout = layoutImageFill('cover', imageRect.width, imageRect.height, image.width, image.height);
    ctx.drawImage(image, imageRect.x + layout.left, imageRect.y + layout.top, layout.width, layout.height);
    ctx.restore();
  }

  // Slogan scroll: paper body with accent rollers at both ends.
  if (scroll) {
    const rollerRadius = scroll.height * 0.42;
    ctx.fillStyle = palette.accent;
    for (const cx of [scroll.x + rollerRadius * 0.55, scroll.x + scroll.width - rollerRadius * 0.55]) {
      ctx.beginPath();
      ctx.arc(cx, scroll.y + scroll.height / 2, rollerRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    fillPaperPanel(ctx, scroll, palette, 0.22);

    const sloganBox: RectPx = {
      x: scroll.x + rollerRadius * 1.4,
      y: scroll.y + scroll.height * 0.18,
      width: scroll.width - rollerRadius * 2.8,
      height: scroll.height * 0.64,
    };
    drawCenteredFit(ctx, object.slogan, sloganBox, OBJECT_SLOGAN_FONT_MM * SCALE, palette.ink, 0.6);
  }

  // Name band over the card background.
  drawCenteredFit(ctx, object.name, name, OBJECT_NAME_FONT_MM * SCALE, palette.onCardBg, 0.55);

  // Quantity badge floats over the window's top-right corner.
  if (object.quantity !== null && Number.isFinite(object.quantity)) {
    const badge = zones.badge;
    const cx = badge.cx * SCALE;
    const cy = badge.cy * SCALE;
    const r = badge.r * SCALE;

    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = palette.frame;
    ctx.lineWidth = Math.max(2, r * 0.12);
    ctx.stroke();

    drawCenteredFit(
      ctx,
      String(Math.max(0, Math.round(object.quantity))),
      { x: cx - r * 0.7, y: cy - r * 0.6, width: r * 1.4, height: r * 1.2 },
      OBJECT_BADGE_FONT_MM * SCALE,
      palette.ink,
      0.7
    );
  }

  return toDataUrl(canvas);
};

/** Description face: paper name plate, «Описание» label and justified text frame. */
export const renderDescriptionFace = (object: GameObject): string => {
  const size = objectFaceSizePx();
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = get2dContext(canvas);
  const palette = OBJECT_PALETTES[object.theme];

  drawCardBase(ctx, size, palette);

  const zones = descriptionZones(objectFaceRectMm());
  const name = toPx(zones.name);
  const label = toPx(zones.label);
  const frame = toPx(zones.frame);
  const text = toPx(zones.text);

  fillPaperPanel(ctx, name, palette, 0.14);
  drawCenteredFit(ctx, object.name, name, OBJECT_NAME_FONT_MM * SCALE, palette.ink, 0.55);

  drawCenteredFit(ctx, 'Описание', label, OBJECT_LABEL_FONT_MM * SCALE, palette.onCardBg, 0.85);

  // Framed text box: paper panel with a thin border on the card.
  fillPaperPanel(ctx, frame, palette, 0.06);
  ctx.strokeStyle = palette.frame;
  ctx.lineWidth = Math.max(2, size.width * 0.004);
  roundRectPath(ctx, frame.x, frame.y, frame.width, frame.height, Math.min(frame.width, frame.height) * 0.06);
  ctx.stroke();

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
  return toDataUrl(canvas);
};

const drawJustifiedLines = (
  ctx: CanvasRenderingContext2D,
  lines: MarkedLine[],
  box: RectPx,
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

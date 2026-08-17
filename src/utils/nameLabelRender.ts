import type { FontOption, NameBackgroundType, NameSettings } from '../types';
import { isPresetBackground } from './presetOverlays';

interface LabelPalette {
  textColor: string;
  darkText: boolean;
}

const LABEL_PALETTE: Record<
  Exclude<
    NameBackgroundType,
    | 'sketch'
    | 'gothic'
    | 'celestial'
    | 'forest'
    | 'arcane'
    | 'infernal'
    | 'frost'
    | 'dwarven'
    | 'steampunk'
    | 'nautical'
    | 'lower-tavern'
    | 'lower-alchemist'
    | 'lower-parchment'
    | 'lower-silver'
    | 'lower-arcane'
    | 'lower-royal'
    | 'lower-wild'
    | 'lower-infernal'
  >,
  LabelPalette
> = {
  'gradient-dark': { textColor: '#fffdf8', darkText: false },
  'gradient-gold': { textColor: '#fff6d8', darkText: false },
  'gradient-red': { textColor: '#ffe8e2', darkText: false },
  'gradient-emerald': { textColor: '#e8ffe8', darkText: false },
  'gradient-arcane': { textColor: '#f4e8ff', darkText: false },
  'gradient-ice': { textColor: '#eef7ff', darkText: false },
  'gradient-fire': { textColor: '#fff0d4', darkText: false },
};

const GRADIENT_STOPS: Record<
  Extract<NameBackgroundType, `gradient-${string}`>,
  { offset: number; color: string }[]
> = {
  'gradient-dark': [
    { offset: 0, color: 'rgba(0, 0, 0, 0.96)' },
    { offset: 0.18, color: 'rgba(10, 6, 4, 0.9)' },
    { offset: 0.42, color: 'rgba(18, 12, 8, 0.62)' },
    { offset: 0.7, color: 'rgba(28, 18, 10, 0.22)' },
    { offset: 1, color: 'rgba(0, 0, 0, 0)' },
  ],
  'gradient-gold': [
    { offset: 0, color: 'rgba(48, 28, 4, 0.97)' },
    { offset: 0.16, color: 'rgba(120, 78, 14, 0.92)' },
    { offset: 0.38, color: 'rgba(196, 140, 36, 0.78)' },
    { offset: 0.62, color: 'rgba(230, 190, 80, 0.32)' },
    { offset: 1, color: 'rgba(210, 170, 60, 0)' },
  ],
  'gradient-red': [
    { offset: 0, color: 'rgba(42, 4, 8, 0.97)' },
    { offset: 0.16, color: 'rgba(110, 14, 20, 0.9)' },
    { offset: 0.4, color: 'rgba(176, 36, 32, 0.72)' },
    { offset: 0.68, color: 'rgba(220, 80, 48, 0.26)' },
    { offset: 1, color: 'rgba(160, 30, 20, 0)' },
  ],
  'gradient-emerald': [
    { offset: 0, color: 'rgba(2, 22, 14, 0.97)' },
    { offset: 0.18, color: 'rgba(8, 64, 38, 0.9)' },
    { offset: 0.42, color: 'rgba(22, 122, 70, 0.7)' },
    { offset: 0.7, color: 'rgba(70, 180, 110, 0.22)' },
    { offset: 1, color: 'rgba(20, 80, 50, 0)' },
  ],
  'gradient-arcane': [
    { offset: 0, color: 'rgba(18, 4, 36, 0.97)' },
    { offset: 0.18, color: 'rgba(64, 18, 110, 0.9)' },
    { offset: 0.42, color: 'rgba(118, 48, 180, 0.7)' },
    { offset: 0.68, color: 'rgba(190, 110, 230, 0.24)' },
    { offset: 1, color: 'rgba(80, 30, 130, 0)' },
  ],
  'gradient-ice': [
    { offset: 0, color: 'rgba(6, 16, 36, 0.97)' },
    { offset: 0.18, color: 'rgba(20, 56, 104, 0.88)' },
    { offset: 0.42, color: 'rgba(64, 130, 186, 0.68)' },
    { offset: 0.7, color: 'rgba(170, 214, 240, 0.22)' },
    { offset: 1, color: 'rgba(40, 90, 140, 0)' },
  ],
  'gradient-fire': [
    { offset: 0, color: 'rgba(28, 4, 0, 0.97)' },
    { offset: 0.14, color: 'rgba(110, 22, 2, 0.92)' },
    { offset: 0.34, color: 'rgba(200, 64, 8, 0.8)' },
    { offset: 0.56, color: 'rgba(240, 140, 24, 0.42)' },
    { offset: 0.78, color: 'rgba(255, 210, 80, 0.12)' },
    { offset: 1, color: 'rgba(200, 80, 10, 0)' },
  ],
};

export const getCanvasFont = (font: FontOption, sizePx: number): string => {
  switch (font) {
    case 'medieval':
      return `700 ${sizePx}px "Old Standard TT", "Times New Roman", serif`;
    case 'elegant':
      return `italic ${sizePx}px Georgia, serif`;
    case 'fantasy':
      return `${sizePx}px "Times New Roman", Times, serif`;
    case 'royal':
      return `${sizePx}px Arial, Helvetica, sans-serif`;
    case 'script':
      return `${sizePx}px Verdana, Geneva, sans-serif`;
    case 'ancient':
      return `${sizePx}px "Trebuchet MS", Trebuchet, sans-serif`;
    case 'inscription':
      return `${sizePx}px Palatino, "Palatino Linotype", "Book Antiqua", serif`;
    case 'bold':
      return `bold ${sizePx}px "Courier New", Courier, monospace`;
    default:
      return `700 ${sizePx}px "Old Standard TT", "Times New Roman", serif`;
  }
};

export const ensureNameFontsLoaded = async (): Promise<void> => {
  if (typeof document === 'undefined' || !document.fonts) return;
  await document.fonts.load('700 24px "Old Standard TT"').catch(() => undefined);
  await document.fonts.ready;
};

const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
};

const drawGradientBackground = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  bg: Extract<NameBackgroundType, `gradient-${string}`>
) => {
  const vertical = ctx.createLinearGradient(0, h, 0, 0);
  for (const stop of GRADIENT_STOPS[bg]) {
    vertical.addColorStop(stop.offset, stop.color);
  }
  ctx.fillStyle = vertical;
  ctx.fillRect(0, 0, w, h);

  const vignette = ctx.createLinearGradient(0, 0, w, 0);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0.38)');
  vignette.addColorStop(0.18, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(0.82, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.38)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
};

export const drawFittedName = (
  ctx: CanvasRenderingContext2D,
  text: string,
  font: FontOption,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  sizeScale: number = 1
) => {
  const maxWidth = w * 0.94;
  const maxHeight = h * 0.9;
  let fontSize = Math.floor(h * 0.72 * sizeScale);
  const minFontSize = 10;
  let lines: string[] = [];
  let totalTextHeight = 0;
  const lineHeightMultiplier = 1.1;

  while (fontSize >= minFontSize) {
    ctx.font = getCanvasFont(font, fontSize);
    lines = wrapText(ctx, text, maxWidth);
    totalTextHeight = lines.length * fontSize * lineHeightMultiplier;
    if (totalTextHeight <= maxHeight) break;
    fontSize -= 1;
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.shadowColor = 'rgba(255, 255, 255, 0.25)';
  ctx.shadowBlur = 1;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;

  const lineHeight = fontSize * lineHeightMultiplier;
  const startY = y + (h - totalTextHeight) / 2 + lineHeight / 2;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x + w / 2, startY + i * lineHeight);
  }
  ctx.shadowColor = 'transparent';
};

/**
 * Renders character name label to a canvas data URL (gradient styles)
 */
export const renderNameLabelToDataUrl = async (
  nameSettings: NameSettings,
  widthPx: number,
  heightPx: number,
  rotationDeg: number = 0
): Promise<string> => {
  const canvas = document.createElement('canvas');

  if (Math.abs(rotationDeg) === 90) {
    canvas.width = heightPx;
    canvas.height = widthPx;
  } else {
    canvas.width = widthPx;
    canvas.height = heightPx;
  }

  const ctx = canvas.getContext('2d')!;

  if (rotationDeg !== 0) {
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotationDeg * Math.PI) / 180);
    ctx.translate(-widthPx / 2, -heightPx / 2);
  }

  if (isPresetBackground(nameSettings.background)) {
    return canvas.toDataURL('image/png');
  }

  drawGradientBackground(ctx, widthPx, heightPx, nameSettings.background);

  const palette = LABEL_PALETTE[nameSettings.background];
  const maxWidth = widthPx - 32;
  const maxHeight = heightPx - 16;
  const lineHeightMultiplier = 1.15;

  let fontSize = Math.floor(heightPx * 0.45);
  const minFontSize = 14;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = palette.textColor;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  let lines: string[] = [];
  let totalTextHeight = 0;

  while (fontSize >= minFontSize) {
    ctx.font = getCanvasFont(nameSettings.font, fontSize);
    lines = wrapText(ctx, nameSettings.name, maxWidth);
    const lineHeight = fontSize * lineHeightMultiplier;
    totalTextHeight = lines.length * lineHeight;
    if (totalTextHeight <= maxHeight) break;
    fontSize -= 2;
  }

  const lineHeight = fontSize * lineHeightMultiplier;
  const startY = (heightPx - totalTextHeight) / 2 + lineHeight / 2;

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], widthPx / 2, startY + i * lineHeight);
  }

  return canvas.toDataURL('image/png');
};

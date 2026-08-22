import type { BlockSizeOption, FontOption } from '../types';

export const NAME_LINE_HEIGHT = 1.1;
export const NAME_MAX_LINES = 2;

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

export const getNameLetterSpacingEm = (font: FontOption): number =>
  font === 'medieval' ? 0.04 : 0;

export const getNameSizeScale = (blockSize: BlockSizeOption): number => {
  if (blockSize === 'small') return 0.72;
  if (blockSize === 'medium') return 0.86;
  return 1;
};

export const ensureNameFontsLoaded = async (): Promise<void> => {
  if (typeof document === 'undefined' || !document.fonts) return;
  await Promise.all([
    document.fonts.load('700 24px "Old Standard TT"').catch(() => undefined),
    document.fonts.load('700 24px Cinzel').catch(() => undefined),
    document.fonts.load('600 24px "Crimson Pro"').catch(() => undefined),
  ]);
  await document.fonts.ready;
};

export const measureNameWidth = (
  text: string,
  fontSize: number,
  font: FontOption,
  measureGlyphs: (s: string) => number
): number => {
  const spacing = getNameLetterSpacingEm(font) * fontSize * Math.max(0, text.length - 1);
  return measureGlyphs(text) + spacing;
};

export const wrapNameText = (
  text: string,
  maxWidth: number,
  measure: (s: string) => number
): string[] => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (currentLine && measure(testLine) > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
};

export interface FittedNameLayout {
  fontSize: number;
  lines: string[];
  lineHeight: number;
}

export const layoutFittedName = (
  text: string,
  boxWidth: number,
  boxHeight: number,
  measureAt: (fontSize: number, s: string) => number,
  sizeScale: number = 1
): FittedNameLayout => {
  const trimmed = text.trim();
  const absoluteMin = 4;
  const maxWidth = Math.max(1, boxWidth * 0.94);
  const maxHeight = Math.max(1, boxHeight * 0.92);
  let fontSize = Math.max(
    absoluteMin,
    Math.floor(boxHeight * 0.72 * sizeScale) || absoluteMin
  );
  let lines = trimmed ? [trimmed] : [];

  if (!trimmed) {
    return { fontSize, lines: [], lineHeight: fontSize * NAME_LINE_HEIGHT };
  }

  const layoutAt = (size: number, allowWrap: boolean) => {
    const wrapped = allowWrap
      ? wrapNameText(trimmed, maxWidth, (s) => measureAt(size, s))
      : [trimmed];
    return {
      lines: wrapped,
      tooMany: wrapped.length > NAME_MAX_LINES,
      tooWide: wrapped.some((line) => measureAt(size, line) > maxWidth + 0.5),
      tooTall: wrapped.length * size * NAME_LINE_HEIGHT > maxHeight,
    };
  };

  while (fontSize >= absoluteMin) {
    const wrapped = layoutAt(fontSize, true);
    if (wrapped.tooMany || (wrapped.tooTall && wrapped.lines.length > 1)) {
      const single = layoutAt(fontSize, false);
      if (!single.tooWide && !single.tooTall) {
        lines = single.lines;
        break;
      }
      if (fontSize === absoluteMin) {
        lines = single.tooTall ? [trimmed] : single.lines;
        break;
      }
      fontSize -= 1;
      continue;
    }
    if (wrapped.tooWide || wrapped.tooTall) {
      if (fontSize === absoluteMin) {
        lines = wrapped.lines.slice(0, NAME_MAX_LINES);
        break;
      }
      fontSize -= 1;
      continue;
    }
    lines = wrapped.lines;
    break;
  }

  return {
    fontSize,
    lines,
    lineHeight: fontSize * NAME_LINE_HEIGHT,
  };
};

let measureCtx: CanvasRenderingContext2D | null = null;

export const measureNameWithCanvas = (
  font: FontOption,
  fontSize: number,
  text: string
): number => {
  if (typeof document === 'undefined') {
    return text.length * fontSize * 0.55;
  }
  if (!measureCtx) {
    const canvas = document.createElement('canvas');
    measureCtx = canvas.getContext('2d');
  }
  if (!measureCtx) return text.length * fontSize * 0.55;
  measureCtx.font = getCanvasFont(font, fontSize);
  return measureNameWidth(text, fontSize, font, (s) => measureCtx!.measureText(s).width);
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
  const trimmed = text.trim();
  if (!trimmed || w <= 0 || h <= 0) return;

  const { fontSize, lines, lineHeight } = layoutFittedName(
    trimmed,
    w,
    h,
    (size, s) => {
      ctx.font = getCanvasFont(font, size);
      return measureNameWidth(s, size, font, (value) => ctx.measureText(value).width);
    },
    sizeScale
  );

  const maxWidth = w * 0.94;
  const totalTextHeight = lines.length * lineHeight;
  ctx.font = getCanvasFont(font, fontSize);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.shadowColor = 'rgba(255, 255, 255, 0.25)';
  ctx.shadowBlur = 1;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;

  const startY = y + (h - totalTextHeight) / 2 + lineHeight / 2;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x + w / 2, startY + i * lineHeight, maxWidth);
  }
  ctx.shadowColor = 'transparent';
};

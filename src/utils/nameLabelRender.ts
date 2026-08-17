import type { FontOption } from '../types';

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

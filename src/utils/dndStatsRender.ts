import type { FontOption, DndStatsSettings } from '../types';
import { getCanvasFont } from './nameLabelRender';
import {
  ABILITY_KEYS,
  ABILITY_SHEET_LABELS,
  abilityModifier,
  formatStat,
  getCombatStatValue,
} from './dndStats';
import { COMPACT_COMBAT_STATS, ICON_COMBAT_STATS, STAT_ICON_PATHS, type StatIconKind } from './statIcons';

const INK = '#1b1b1b';
const PAPER = '#f4efe3';
const BOX = '#fffcf6';

const fillBeveledRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  bevel: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + bevel, y);
  ctx.lineTo(x + w - bevel, y);
  ctx.lineTo(x + w, y + bevel);
  ctx.lineTo(x + w, y + h - bevel);
  ctx.lineTo(x + w - bevel, y + h);
  ctx.lineTo(x + bevel, y + h);
  ctx.lineTo(x, y + h - bevel);
  ctx.lineTo(x, y + bevel);
  ctx.closePath();
  ctx.fill();
};

const strokeBeveledRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  bevel: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + bevel, y);
  ctx.lineTo(x + w - bevel, y);
  ctx.lineTo(x + w, y + bevel);
  ctx.lineTo(x + w, y + h - bevel);
  ctx.lineTo(x + w - bevel, y + h);
  ctx.lineTo(x + bevel, y + h);
  ctx.lineTo(x, y + h - bevel);
  ctx.lineTo(x, y + bevel);
  ctx.closePath();
  ctx.stroke();
};

const drawSheetBox = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) => {
  const bevel = Math.min(w, h) * 0.04;
  ctx.fillStyle = BOX;
  fillBeveledRect(ctx, x, y, w, h, bevel);
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1, Math.min(w, h) * 0.018);
  strokeBeveledRect(ctx, x, y, w, h, bevel);
  ctx.lineWidth = Math.max(0.8, Math.min(w, h) * 0.01);
  strokeBeveledRect(ctx, x + 2.2, y + 2.2, w - 4.4, h - 4.4, Math.max(1, bevel * 0.7));
};

const drawCenteredText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth?: number
) => {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (maxWidth) {
    ctx.fillText(text, x, y, maxWidth);
  } else {
    ctx.fillText(text, x, y);
  }
};

const drawFittedName = (
  ctx: CanvasRenderingContext2D,
  text: string,
  font: FontOption,
  x: number,
  y: number,
  w: number,
  h: number
) => {
  if (!text) return;
  let fontSize = Math.floor(h * 0.78);
  const minFontSize = 8;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#111';
  while (fontSize > minFontSize) {
    ctx.font = getCanvasFont(font, fontSize);
    if (ctx.measureText(text).width <= w) break;
    fontSize -= 1;
  }
  ctx.fillText(text, x, y + h / 2, w);
};

const drawAbilityBox = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  score: number | null
) => {
  drawSheetBox(ctx, x, y, w, h);
  ctx.fillStyle = INK;
  ctx.font = `700 ${Math.max(7, h * 0.16)}px Cinzel, Georgia, serif`;
  drawCenteredText(ctx, label, x + w / 2, y + h * 0.18, w * 0.9);

  ctx.font = `700 ${Math.max(12, h * 0.4)}px Cinzel, Georgia, serif`;
  drawCenteredText(ctx, formatStat(score), x + w / 2, y + h * 0.54, w * 0.9);

  const modifier = score == null ? '' : formatStat(abilityModifier(score), true);
  ctx.font = `600 ${Math.max(8, h * 0.16)}px "Crimson Pro", Georgia, serif`;
  drawCenteredText(ctx, modifier, x + w / 2, y + h * 0.84, w * 0.9);
};

const drawLabeledField = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  value: string,
  label: string
) => {
  ctx.fillStyle = INK;
  ctx.font = `400 ${h * 0.32}px "Crimson Pro", Georgia, serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x + w * 0.06, y + h * 0.38, w * 0.88);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.05, y + h * 0.55);
  ctx.lineTo(x + w * 0.95, y + h * 0.55);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.font = `700 ${h * 0.2}px Cinzel, Georgia, serif`;
  ctx.fillText(label.toUpperCase(), x + w * 0.06, y + h * 0.76, w * 0.88);
};

const drawCombatIcon = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  icon: StatIconKind,
  value: string,
  label: string
) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 100, size / 100);
  const path = new Path2D(STAT_ICON_PATHS[icon]);
  ctx.fillStyle = BOX;
  ctx.fill(path);
  ctx.strokeStyle = INK;
  ctx.lineJoin = 'round';
  ctx.lineWidth = 3;
  ctx.stroke(path);
  ctx.restore();

  ctx.fillStyle = INK;
  ctx.font = `700 ${size * 0.2}px Cinzel, Georgia, serif`;
  drawCenteredText(ctx, value, x + size / 2, y + size * 0.46, size * 0.48);
  ctx.font = `700 ${size * 0.1}px Cinzel, Georgia, serif`;
  drawCenteredText(ctx, label, x + size / 2, y + size * 0.64, size * 0.5);
};

export const drawDndStatsPanel = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  stats: DndStatsSettings,
  name: string,
  font: FontOption
): void => {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, width, height);

  const m = Math.min(width, height) * 0.032;
  ctx.strokeStyle = INK;
  ctx.lineWidth = m * 0.45;
  ctx.strokeRect(m * 0.35, m * 0.35, width - m * 0.7, height - m * 0.7);
  ctx.lineWidth = m * 0.28;
  ctx.strokeRect(m * 0.85, m * 0.85, width - m * 1.7, height - m * 1.7);

  const padX = width * 0.055;
  const padY = height * 0.035;
  const innerX = padX;
  const innerY = padY;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const gap = Math.min(width, height) * 0.012;

  const nameH = innerH * 0.125;
  const metaH = innerH * 0.095;
  drawSheetBox(ctx, innerX, innerY, innerW, nameH);
  ctx.fillStyle = INK;
  ctx.font = `700 ${nameH * 0.18}px Cinzel, Georgia, serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('ИМЯ ПЕРСОНАЖА', innerX + innerW * 0.03, innerY + nameH * 0.12);
  const nameLineY = innerY + nameH * 0.78;
  ctx.beginPath();
  ctx.moveTo(innerX + innerW * 0.03, nameLineY);
  ctx.lineTo(innerX + innerW * 0.97, nameLineY);
  ctx.lineWidth = 1;
  ctx.strokeStyle = INK;
  ctx.stroke();
  drawFittedName(
    ctx,
    name.trim(),
    font,
    innerX + innerW * 0.03,
    innerY + nameH * 0.34,
    innerW * 0.94,
    nameH * 0.42
  );

  const metaY = innerY + nameH + gap;
  drawSheetBox(ctx, innerX, metaY, innerW, metaH);
  const classW = innerW * 0.58;
  ctx.beginPath();
  ctx.moveTo(innerX + classW, metaY + 3);
  ctx.lineTo(innerX + classW, metaY + metaH - 3);
  ctx.stroke();
  drawLabeledField(ctx, innerX, metaY, classW, metaH, stats.classLevel.trim(), 'Класс и уровень');
  drawLabeledField(
    ctx,
    innerX + classW,
    metaY,
    innerW - classW,
    metaH,
    stats.race.trim(),
    'Раса'
  );

  const bodyY = metaY + metaH + gap * 1.2;
  const bodyH = innerY + innerH - bodyY;
  const abilitiesW = innerW * 0.34;
  const rightX = innerX + abilitiesW + gap * 1.3;
  const rightW = innerX + innerW - rightX;
  const abilityGap = gap * 0.85;
  const abilityH = (bodyH - abilityGap * 5) / 6;

  ABILITY_KEYS.forEach((key, i) => {
    drawAbilityBox(
      ctx,
      innerX,
      bodyY + i * (abilityH + abilityGap),
      abilitiesW,
      abilityH,
      ABILITY_SHEET_LABELS[key],
      stats.abilities[key]
    );
  });

  const compactH = metaH * 2.05;
  drawSheetBox(ctx, rightX, bodyY, rightW, compactH);
  const compactCellW = rightW / 2;
  const compactCellH = compactH / 2;
  ctx.beginPath();
  ctx.moveTo(rightX + compactCellW, bodyY + 3);
  ctx.lineTo(rightX + compactCellW, bodyY + compactH - 3);
  ctx.moveTo(rightX + 3, bodyY + compactCellH);
  ctx.lineTo(rightX + rightW - 3, bodyY + compactCellH);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1;
  ctx.stroke();
  COMPACT_COMBAT_STATS.forEach((stat, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    drawLabeledField(
      ctx,
      rightX + col * compactCellW,
      bodyY + row * compactCellH,
      compactCellW,
      compactCellH,
      getCombatStatValue(stats, stat.id),
      stat.label
    );
  });

  const iconGap = gap * 1.35;
  const iconTop = bodyY + compactH + gap * 1.2;
  const iconSize = Math.min((rightW - iconGap) / 2, innerY + innerH - iconTop);
  ICON_COMBAT_STATS.forEach((stat, i) => {
    drawCombatIcon(
      ctx,
      rightX + i * (iconSize + iconGap),
      iconTop,
      iconSize,
      stat.icon,
      getCombatStatValue(stats, stat.id),
      stat.label
    );
  });
};

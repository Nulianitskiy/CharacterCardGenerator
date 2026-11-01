import { describe, expect, it } from 'vitest';
import {
  clampNameFontSizePercent,
  getNameSizeScale,
  layoutFittedName,
  wrapNameText,
} from './nameLabelRender';

const charWidth = (fontSize: number, text: string) => text.length * fontSize * 0.5;

describe('wrapNameText', () => {
  it('keeps a short name on one line', () => {
    expect(wrapNameText('Ада', 100, (s) => s.length * 10)).toEqual(['Ада']);
  });

  it('wraps extra words onto the next line', () => {
    expect(wrapNameText('Ada the Brave', 80, (s) => s.length * 10)).toEqual([
      'Ada the',
      'Brave',
    ]);
  });
});

describe('layoutFittedName', () => {
  it('shrinks a long unbreakable name to fit the width', () => {
    const layout = layoutFittedName(
      'Supercalifragilisticexpialidocious',
      80,
      24,
      charWidth
    );
    expect(layout.lines).toHaveLength(1);
    expect(layout.lines[0]!.length * layout.fontSize * 0.5).toBeLessThanOrEqual(80 * 0.94 + 1);
  });

  it('uses two lines for a multi-word name when height allows', () => {
    const layout = layoutFittedName('Ada the Brave', 70, 40, charWidth);
    expect(layout.lines.length).toBeGreaterThan(1);
    expect(layout.lines.length).toBeLessThanOrEqual(2);
    expect(layout.lines.join(' ')).toBe('Ada the Brave');
  });

  it('falls back to one line when the box is too short for wrapping', () => {
    const layout = layoutFittedName('Ada the Brave', 80, 9, charWidth);
    expect(layout.lines).toEqual(['Ada the Brave']);
  });
});

describe('clampNameFontSizePercent', () => {
  it('keeps values inside the allowed range', () => {
    expect(clampNameFontSizePercent(100)).toBe(100);
    expect(clampNameFontSizePercent(72)).toBe(72);
    expect(clampNameFontSizePercent(1)).toBe(25);
    expect(clampNameFontSizePercent(9999)).toBe(300);
  });

  it('falls back to the minimum for non-finite values', () => {
    expect(clampNameFontSizePercent(Number.NaN)).toBe(25);
    expect(clampNameFontSizePercent(Number.POSITIVE_INFINITY)).toBe(25);
  });
});

describe('getNameSizeScale', () => {
  it('maps percents to the fit scale used by both renderers', () => {
    expect(getNameSizeScale(100)).toBe(1);
    expect(getNameSizeScale(86)).toBeCloseTo(0.86);
    expect(getNameSizeScale(50)).toBeCloseTo(0.5);
    expect(getNameSizeScale(500)).toBeCloseTo(3);
  });
});

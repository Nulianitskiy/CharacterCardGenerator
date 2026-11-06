import { describe, expect, it } from 'vitest';
import { fitJustifiedText, justifyLine, wrapLines } from './justifiedText';
import type { MakeMeasure } from './justifiedText';

// Fake metrics: a character is 0.5 font-size units wide, spaces included.
const makeMeasure: MakeMeasure = (fontSize) => (text) => text.length * fontSize * 0.5;

const wrap = (text: string, maxWidth: number, fontSize = 10) =>
  wrapLines(text, maxWidth, makeMeasure(fontSize));

describe('wrapLines', () => {
  it('breaks greedily on whole words', () => {
    // fontSize 10 → 5 units per character; box 50 → 10 characters per line.
    expect(wrap('aaaa bb ccccdd eee', 50)).toEqual(['aaaa bb', 'ccccdd eee']);
  });

  it('keeps explicit line breaks and blank paragraphs', () => {
    expect(wrap('a\n\nb', 50)).toEqual(['a', '', 'b']);
    expect(wrap('', 50)).toEqual(['']);
  });

  it('never breaks a word that alone exceeds the box', () => {
    expect(wrap('unbearablylongword x', 20)).toEqual(['unbearablylongword', 'x']);
  });

  it('collapses repeated spaces', () => {
    expect(wrap('a   b \t c', 50)).toEqual(['a b c']);
  });
});

describe('justifyLine', () => {
  it('distributes the leftover width between words', () => {
    // 'aa bb' at fs10: natural 25 units in a 45-unit box → 20 split over 1 gap.
    const line = justifyLine('aa bb', 45, makeMeasure(10));
    expect(line.words).toEqual(['aa', 'bb']);
    expect(line.gapStretch).toBeCloseTo(20, 9);
  });

  it('does not stretch the last line or single-word lines', () => {
    expect(justifyLine('aa bb', 45, makeMeasure(10), true).gapStretch).toBe(0);
    expect(justifyLine('solo', 45, makeMeasure(10)).gapStretch).toBe(0);
  });

  it('never produces negative stretch when a line already overflows', () => {
    expect(justifyLine('aaaa bbbb', 20, makeMeasure(10)).gapStretch).toBe(0);
  });
});

describe('fitJustifiedText', () => {
  const request = (text: string, width: number, height: number, base = 10, min = 5) =>
    fitJustifiedText({
      text,
      width,
      height,
      baseFontSize: base,
      minFontSize: min,
      lineHeightFactor: 1.25,
      makeMeasure,
    });

  it('returns base size untouched when text already fits', () => {
    const fit = request('short text', 100, 100);
    expect(fit.fontSize).toBe(10);
    expect(fit.overflow).toBe(false);
    expect(fit.lines.length).toBe(1);
  });

  it('shrinks the font until the wrapped lines fit the height', () => {
    // 20 one-letter words: two lines at every size, so only the font shrinks.
    const fit = request('x '.repeat(20).trim(), 100, 16);
    expect(fit.fontSize).toBeLessThan(10);
    expect(fit.fontSize).toBeGreaterThanOrEqual(5);
    expect(fit.overflow).toBe(false);
    expect(fit.lines.length * fit.lineHeight).toBeLessThanOrEqual(16 + 1e-6);
  });

  it('reports overflow and truncates at the minimal size', () => {
    const fit = request('x '.repeat(60).trim(), 100, 10);
    expect(fit.overflow).toBe(true);
    expect(fit.fontSize).toBe(5);
    expect(fit.lines.length).toBe(Math.floor(10 / fit.lineHeight));
  });

  it('treats empty text as fitting at base size', () => {
    const fit = request('   \n  ', 100, 50);
    expect(fit.fontSize).toBe(10);
    expect(fit.lines).toEqual([]);
    expect(fit.overflow).toBe(false);
  });

  it('is monotonic: bigger boxes never need smaller fonts', () => {
    const text = 'one '.repeat(12).trim();
    const small = request(text, 100, 30);
    const tall = request(text, 100, 120);
    expect(tall.fontSize).toBeGreaterThanOrEqual(small.fontSize);
  });
});

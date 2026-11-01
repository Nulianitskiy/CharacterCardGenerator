import { describe, expect, it } from 'vitest';
import {
  filterNameFontChoices,
  fontValuesEqual,
  getNameLetterSpacingEm,
  getCanvasFont,
  getLocalCssFontStack,
  groupLocalFontFamilies,
  makeLocalNameFont,
  sanitizeFontFamily,
  SYSTEM_FONT_STACKS,
} from './nameFont';
import type { NameFontChoice } from './nameFont';

describe('getCanvasFont', () => {
  it('maps built-in presets to weight, style and family stack', () => {
    expect(getCanvasFont('medieval', 24)).toBe(
      'normal 700 24px "Old Standard TT", "Times New Roman", serif'
    );
    expect(getCanvasFont('elegant', 20)).toBe('italic 400 20px Georgia, serif');
    expect(getCanvasFont('bold', 12)).toBe('normal 700 12px "Courier New", Courier, monospace');
    expect(getCanvasFont('royal', 10)).toBe('normal 400 10px Arial, Helvetica, sans-serif');
  });

  it('maps device fonts to the curated fallback stack when known', () => {
    expect(getCanvasFont(makeLocalNameFont('Garamond'), 18)).toBe(
      'normal 400 18px Garamond, "EB Garamond", "Times New Roman", serif'
    );
  });

  it('quotes unknown device families and appends a generic fallback', () => {
    expect(getCanvasFont(makeLocalNameFont('My Custom Font'), 16)).toBe(
      'normal 400 16px "My Custom Font", sans-serif'
    );
  });
});

describe('sanitizeFontFamily', () => {
  it('strips CSS-breaking characters and collapses whitespace', () => {
    expect(sanitizeFontFamily('  Fo"o\\B\'\nar  ')).toBe('FooB ar');
    expect(sanitizeFontFamily('  We"ird  Font  ')).toBe('Weird Font');
  });

  it('drops empty names', () => {
    expect(sanitizeFontFamily('   ')).toBe('');
  });
});

describe('getLocalCssFontStack', () => {
  it('falls back to sans-serif for an empty family', () => {
    expect(getLocalCssFontStack('')).toBe('sans-serif');
  });

  it('resolves curated families case-insensitively', () => {
    expect(getLocalCssFontStack('impact')).toBe(
      'Impact, Haettenschweiler, "Franklin Gothic Bold", sans-serif'
    );
  });
});

describe('getNameLetterSpacingEm', () => {
  it('keeps the medieval spacing and zeroes everything else', () => {
    expect(getNameLetterSpacingEm('medieval')).toBe(0.04);
    expect(getNameLetterSpacingEm('bold')).toBe(0);
    expect(getNameLetterSpacingEm(makeLocalNameFont('Impact'))).toBe(0);
  });
});

describe('fontValuesEqual', () => {
  it('compares presets by key', () => {
    expect(fontValuesEqual('medieval', 'medieval')).toBe(true);
    expect(fontValuesEqual('medieval', 'bold')).toBe(false);
  });

  it('compares device families case-insensitively', () => {
    expect(fontValuesEqual(makeLocalNameFont('Garamond'), makeLocalNameFont('garamond'))).toBe(
      true
    );
    expect(fontValuesEqual(makeLocalNameFont('Garamond'), 'medieval')).toBe(false);
  });
});

describe('filterNameFontChoices', () => {
  const choices: NameFontChoice[] = [
    { value: 'medieval', label: 'Old Standard TT' },
    { value: makeLocalNameFont('Impact'), label: 'Impact' },
  ];

  it('returns everything for a blank query', () => {
    expect(filterNameFontChoices(choices, '  ')).toHaveLength(2);
  });

  it('matches case-insensitively by substring', () => {
    expect(filterNameFontChoices(choices, 'imp')).toEqual([choices[1]]);
    expect(filterNameFontChoices(choices, 'STANDARD')).toEqual([choices[0]]);
    expect(filterNameFontChoices(choices, 'zzz')).toEqual([]);
  });
});

describe('groupLocalFontFamilies', () => {
  it('deduplicates case-insensitively, sanitizes and sorts', () => {
    expect(
      groupLocalFontFamilies([
        { family: 'zebra Font' },
        { family: 'Zebra Font' },
        { family: '"Alpha' },
        { family: '   ' },
      ])
    ).toEqual(['Alpha', 'zebra Font']);
  });
});

describe('SYSTEM_FONT_STACKS', () => {
  it('keeps unique family names', () => {
    const names = SYSTEM_FONT_STACKS.map((entry) => entry.family.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });
});

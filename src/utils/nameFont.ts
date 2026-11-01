import type { CSSProperties } from 'react';
import type { FontOption, LocalNameFont, NameFontValue } from '../types';

/**
 * Fully resolved visual style of a name font. Both renderers must derive from
 * this shape: screen CSS classes for built-ins mirror BUILTIN_FONT_STYLES,
 * canvas strings and custom-family inline styles come from here.
 */
export interface ResolvedNameFont {
  /** CSS font-family list (may contain several fallbacks and a generic) */
  familyStack: string;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  letterSpacingEm: number;
}

const MAX_FAMILY_LENGTH = 120;
const DEFAULT_GENERIC_FAMILY = 'sans-serif';

/**
 * Mirrors the .name-font-* rules in src/styles/cardVisuals.css and the canvas
 * strings previously hardcoded in nameLabelRender. Keep all three in sync.
 */
const BUILTIN_FONT_STYLES: Record<FontOption, ResolvedNameFont> = {
  medieval: {
    familyStack: '"Old Standard TT", "Times New Roman", serif',
    fontWeight: 700,
    fontStyle: 'normal',
    letterSpacingEm: 0.04,
  },
  elegant: {
    familyStack: 'Georgia, serif',
    fontWeight: 400,
    fontStyle: 'italic',
    letterSpacingEm: 0,
  },
  fantasy: {
    familyStack: '"Times New Roman", Times, serif',
    fontWeight: 400,
    fontStyle: 'normal',
    letterSpacingEm: 0,
  },
  royal: {
    familyStack: 'Arial, Helvetica, sans-serif',
    fontWeight: 400,
    fontStyle: 'normal',
    letterSpacingEm: 0,
  },
  script: {
    familyStack: 'Verdana, Geneva, sans-serif',
    fontWeight: 400,
    fontStyle: 'normal',
    letterSpacingEm: 0,
  },
  ancient: {
    familyStack: '"Trebuchet MS", Trebuchet, sans-serif',
    fontWeight: 400,
    fontStyle: 'normal',
    letterSpacingEm: 0,
  },
  inscription: {
    familyStack: 'Palatino, "Palatino Linotype", "Book Antiqua", serif',
    fontWeight: 400,
    fontStyle: 'normal',
    letterSpacingEm: 0,
  },
  bold: {
    familyStack: '"Courier New", Courier, monospace',
    fontWeight: 700,
    fontStyle: 'normal',
    letterSpacingEm: 0,
  },
};

/**
 * Curated fallback stacks for common system fonts, used when a picked family
 * is not installed. Doubles as the always-available "wide list" in the picker
 * for browsers without Local Font Access (Firefox, Safari).
 */
export const SYSTEM_FONT_STACKS: readonly { family: string; stack: string }[] = [
  { family: 'American Typewriter', stack: '"American Typewriter", "Courier New", serif' },
  { family: 'Apple Chancery', stack: '"Apple Chancery", "URW Chancery L", cursive' },
  { family: 'Arial', stack: 'Arial, Helvetica, sans-serif' },
  { family: 'Arial Black', stack: '"Arial Black", "Arial Bold", Gadget, sans-serif' },
  { family: 'Arial Narrow', stack: '"Arial Narrow", Arial, sans-serif' },
  { family: 'Avenir', stack: 'Avenir, "Avenir Next", "Segoe UI", sans-serif' },
  { family: 'Bahnschrift', stack: 'Bahnschrift, "DIN Alternate", "Franklin Gothic Medium", sans-serif' },
  { family: 'Baskerville', stack: 'Baskerville, "Baskerville Old Face", "Times New Roman", serif' },
  { family: 'Book Antiqua', stack: '"Book Antiqua", Palatino, serif' },
  { family: 'Bradley Hand', stack: '"Bradley Hand", "Segoe Print", cursive' },
  { family: 'Calibri', stack: 'Calibri, Carlito, "Segoe UI", sans-serif' },
  { family: 'Cambria', stack: 'Cambria, Georgia, serif' },
  { family: 'Candara', stack: 'Candara, Calibri, sans-serif' },
  { family: 'Cantarell', stack: 'Cantarell, "DejaVu Sans", sans-serif' },
  { family: 'Cascadia Code', stack: '"Cascadia Code", Consolas, monospace' },
  { family: 'Chalkboard SE', stack: '"Chalkboard SE", "Comic Sans MS", cursive' },
  { family: 'Comic Sans MS', stack: '"Comic Sans MS", "Chalkboard SE", "Segoe Print", cursive' },
  { family: 'Consolas', stack: 'Consolas, "DejaVu Sans Mono", Menlo, monospace' },
  { family: 'Constantia', stack: 'Constantia, Georgia, serif' },
  { family: 'Copperplate', stack: 'Copperplate, "Copperplate Gothic Light", fantasy' },
  { family: 'Corbel', stack: 'Corbel, Candara, sans-serif' },
  { family: 'Courier', stack: 'Courier, "Courier New", monospace' },
  { family: 'Courier New', stack: '"Courier New", Courier, monospace' },
  { family: 'DejaVu Sans', stack: '"DejaVu Sans", Verdana, sans-serif' },
  { family: 'DejaVu Sans Mono', stack: '"DejaVu Sans Mono", Consolas, monospace' },
  { family: 'DejaVu Serif', stack: '"DejaVu Serif", Georgia, serif' },
  { family: 'Didot', stack: 'Didot, "Bodoni MT", "Times New Roman", serif' },
  { family: 'Futura', stack: 'Futura, "Century Gothic", "Trebuchet MS", sans-serif' },
  { family: 'Garamond', stack: 'Garamond, "EB Garamond", "Times New Roman", serif' },
  { family: 'Georgia', stack: 'Georgia, serif' },
  { family: 'Gill Sans', stack: '"Gill Sans", "Gill Sans MT", Calibri, sans-serif' },
  { family: 'Helvetica', stack: 'Helvetica, Arial, sans-serif' },
  { family: 'Hoefler Text', stack: '"Hoefler Text", Garamond, serif' },
  { family: 'Impact', stack: 'Impact, Haettenschweiler, "Franklin Gothic Bold", sans-serif' },
  { family: 'Liberation Mono', stack: '"Liberation Mono", "Courier New", monospace' },
  { family: 'Liberation Sans', stack: '"Liberation Sans", Arial, sans-serif' },
  { family: 'Liberation Serif', stack: '"Liberation Serif", "Times New Roman", serif' },
  { family: 'Lucida Console', stack: '"Lucida Console", Monaco, monospace' },
  { family: 'Lucida Sans Unicode', stack: '"Lucida Sans Unicode", "Lucida Grande", sans-serif' },
  { family: 'Menlo', stack: 'Menlo, Consolas, monospace' },
  { family: 'Monaco', stack: 'Monaco, Consolas, monospace' },
  { family: 'Noto Sans', stack: '"Noto Sans", "DejaVu Sans", sans-serif' },
  { family: 'Noto Serif', stack: '"Noto Serif", "DejaVu Serif", serif' },
  { family: 'Old Standard TT', stack: '"Old Standard TT", "Times New Roman", serif' },
  { family: 'Optima', stack: 'Optima, Candara, "Segoe UI", sans-serif' },
  { family: 'Palatino', stack: 'Palatino, "Palatino Linotype", "Book Antiqua", serif' },
  { family: 'Papyrus', stack: 'Papyrus, fantasy' },
  { family: 'Roboto', stack: 'Roboto, "Helvetica Neue", Arial, sans-serif' },
  { family: 'Rockwell', stack: 'Rockwell, "Courier Bold", serif' },
  { family: 'Segoe Print', stack: '"Segoe Print", "Comic Sans MS", cursive' },
  { family: 'Segoe Script', stack: '"Segoe Script", "Bradley Hand", cursive' },
  { family: 'Segoe UI', stack: '"Segoe UI", Frutiger, "Frutiger Linotype", sans-serif' },
  { family: 'Snell Roundhand', stack: '"Snell Roundhand", "Apple Chancery", cursive' },
  { family: 'Tahoma', stack: 'Tahoma, Verdana, sans-serif' },
  { family: 'Times', stack: 'Times, "Times New Roman", serif' },
  { family: 'Times New Roman', stack: '"Times New Roman", Times, serif' },
  { family: 'Trebuchet MS', stack: '"Trebuchet MS", Trebuchet, sans-serif' },
  { family: 'Ubuntu', stack: 'Ubuntu, "DejaVu Sans", sans-serif' },
  { family: 'Verdana', stack: 'Verdana, Geneva, sans-serif' },
];

const STACK_BY_FAMILY: ReadonlyMap<string, string> = new Map(
  SYSTEM_FONT_STACKS.map((entry) => [entry.family.toLowerCase(), entry.stack])
);

export const isLocalNameFont = (font: NameFontValue): font is LocalNameFont =>
  typeof font === 'object' && font !== null && 'localFamily' in font;

/**
 * Strips characters that would break a CSS font-family list.
 */
export const sanitizeFontFamily = (raw: string): string => {
  let cleaned = '';
  for (const char of raw) {
    if (char === '"' || char === "'" || char === '\\') continue;
    const code = char.charCodeAt(0);
    if (code <= 0x1f || code === 0x7f) {
      cleaned += ' ';
      continue;
    }
    cleaned += char;
  }
  return cleaned.replace(/\s+/g, ' ').trim().slice(0, MAX_FAMILY_LENGTH);
};

export const makeLocalNameFont = (family: string): LocalNameFont => ({
  localFamily: sanitizeFontFamily(family),
});

/**
 * CSS font-family list for a device font: curated fallback stack when known,
 * otherwise the quoted family plus a generic fallback.
 */
export const getLocalCssFontStack = (family: string): string => {
  const known = STACK_BY_FAMILY.get(family.toLowerCase());
  if (known) return known;
  const cleaned = sanitizeFontFamily(family);
  return cleaned ? `"${cleaned}", ${DEFAULT_GENERIC_FAMILY}` : DEFAULT_GENERIC_FAMILY;
};

export const resolveNameFont = (font: NameFontValue): ResolvedNameFont => {
  if (isLocalNameFont(font)) {
    return {
      familyStack: getLocalCssFontStack(font.localFamily),
      fontWeight: 400,
      fontStyle: 'normal',
      letterSpacingEm: 0,
    };
  }
  return BUILTIN_FONT_STYLES[font] ?? BUILTIN_FONT_STYLES.medieval;
};

export const getCanvasFont = (font: NameFontValue, sizePx: number): string => {
  const style = resolveNameFont(font);
  return `${style.fontStyle} ${style.fontWeight} ${sizePx}px ${style.familyStack}`;
};

export const getNameLetterSpacingEm = (font: NameFontValue): number =>
  resolveNameFont(font).letterSpacingEm;

/**
 * Full inline style previewing a font (used by the picker).
 */
export const getFontPreviewCss = (font: NameFontValue): CSSProperties => {
  const style = resolveNameFont(font);
  return {
    fontFamily: style.familyStack,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    letterSpacing: `${style.letterSpacingEm}em`,
  };
};

/**
 * Inline override for card/preview renderers: built-ins keep their CSS
 * classes, device fonts need explicit styles. Undefined for built-ins.
 */
export const getNameCssOverride = (font: NameFontValue): CSSProperties | undefined =>
  isLocalNameFont(font) ? getFontPreviewCss(font) : undefined;

export const fontValuesEqual = (a: NameFontValue, b: NameFontValue): boolean => {
  if (isLocalNameFont(a) || isLocalNameFont(b)) {
    return (
      isLocalNameFont(a) &&
      isLocalNameFont(b) &&
      a.localFamily.toLowerCase() === b.localFamily.toLowerCase()
    );
  }
  return a === b;
};

export interface NameFontChoice {
  value: NameFontValue;
  label: string;
}

/**
 * Case-insensitive substring filter used by the picker search box.
 */
export const filterNameFontChoices = (
  choices: readonly NameFontChoice[],
  query: string
): NameFontChoice[] => {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...choices];
  return choices.filter((choice) => choice.label.toLowerCase().includes(needle));
};

/**
 * Deduplicates Local Font Access entries by family (case-insensitive),
 * sanitizes names and sorts them for display.
 */
export const groupLocalFontFamilies = (
  entries: readonly { readonly family?: string }[]
): string[] => {
  const seen = new Set<string>();
  const families: string[] = [];
  for (const entry of entries) {
    const family = sanitizeFontFamily(entry.family ?? '');
    if (!family) continue;
    const key = family.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    families.push(family);
  }
  return families.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
};

import { groupLocalFontFamilies } from './nameFont';

/**
 * Shape of a face returned by the Local Font Access API
 * (`window.queryLocalFonts()`), which is not in the TypeScript DOM lib yet.
 */
export interface LocalFontData {
  readonly family: string;
  readonly fullName: string;
  readonly postscriptName: string;
  readonly style: string;
}

declare global {
  interface Window {
    queryLocalFonts?: () => Promise<LocalFontData[]>;
  }
}

let cachedFamilies: string[] | null = null;

export const isLocalFontAccessSupported = (): boolean =>
  typeof window !== 'undefined' && typeof window.queryLocalFonts === 'function';

export const getCachedLocalFontFamilies = (): string[] | null => cachedFamilies;

/**
 * Requests the device font list (permission prompt in Chromium browsers).
 * Must be called from a user gesture. Resolves once per session afterwards,
 * thanks to the module-level cache.
 */
export const loadLocalFontFamilies = async (): Promise<string[]> => {
  if (cachedFamilies) return cachedFamilies;
  if (!isLocalFontAccessSupported() || !window.queryLocalFonts) {
    throw new Error('Local font access is not supported in this browser');
  }
  const fonts = await window.queryLocalFonts();
  cachedFamilies = groupLocalFontFamilies(fonts);
  return cachedFamilies;
};

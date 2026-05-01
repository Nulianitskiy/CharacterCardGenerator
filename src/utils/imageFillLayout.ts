import type { ImageFillMode } from '../types';

export interface ImageFillLayout {
  width: number;
  height: number;
  left: number;
  top: number;
}

/**
 * Lay out a bitmap in a cw×ch box (CSS pixels) matching screen-preview semantics:
 * cover — crop to fill; fitWidth — match box width, letterbox vertically; fitHeight — match height, letterbox horizontally.
 */
export function layoutImageFill(
  mode: ImageFillMode | undefined,
  cw: number,
  ch: number,
  iw: number,
  ih: number
): ImageFillLayout {
  const m = mode ?? 'cover';
  if (!cw || !ch || !iw || !ih) {
    return { width: cw, height: ch, left: 0, top: 0 };
  }

  if (m === 'cover') {
    const scale = Math.max(cw / iw, ch / ih);
    const width = iw * scale;
    const height = ih * scale;
    return {
      width,
      height,
      left: (cw - width) / 2,
      top: (ch - height) / 2,
    };
  }

  if (m === 'fitWidth') {
    const scale = cw / iw;
    const width = cw;
    const height = ih * scale;
    return {
      width,
      height,
      left: 0,
      top: (ch - height) / 2,
    };
  }

  const scale = ch / ih;
  const height = ch;
  const width = iw * scale;
  return {
    width,
    height,
    left: (cw - width) / 2,
    top: 0,
  };
}

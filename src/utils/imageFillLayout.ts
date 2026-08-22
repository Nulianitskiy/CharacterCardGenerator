import type { ImageFillMode, ImageFocus } from '../types';
import { DEFAULT_IMAGE_FOCUS } from '../types';

export interface ImageFillLayout {
  width: number;
  height: number;
  left: number;
  top: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const normalizeFocus = (focus?: ImageFocus): ImageFocus => ({
  x: Number.isFinite(focus?.x) ? (focus as ImageFocus).x : DEFAULT_IMAGE_FOCUS.x,
  y: Number.isFinite(focus?.y) ? (focus as ImageFocus).y : DEFAULT_IMAGE_FOCUS.y,
});

export const focusFromCoverLayout = (
  cw: number,
  ch: number,
  layout: ImageFillLayout
): ImageFocus => ({
  x: layout.width ? (cw / 2 - layout.left) / layout.width : DEFAULT_IMAGE_FOCUS.x,
  y: layout.height ? (ch / 2 - layout.top) / layout.height : DEFAULT_IMAGE_FOCUS.y,
});

/**
 * Lay out a bitmap in a cw×ch box (CSS pixels) matching screen-preview semantics:
 * cover — crop to fill; fitWidth — match box width, letterbox vertically; fitHeight — match height, letterbox horizontally.
 * Cover can shift the crop via focus (image point 0–1 placed at the box center, then clamped).
 */
export function layoutImageFill(
  mode: ImageFillMode | undefined,
  cw: number,
  ch: number,
  iw: number,
  ih: number,
  focus?: ImageFocus
): ImageFillLayout {
  const m = mode ?? 'cover';
  if (!cw || !ch || !iw || !ih) {
    return { width: cw, height: ch, left: 0, top: 0 };
  }

  if (m === 'cover') {
    const scale = Math.max(cw / iw, ch / ih);
    const width = iw * scale;
    const height = ih * scale;
    const { x, y } = normalizeFocus(focus);
    const left = clamp(cw / 2 - x * width, cw - width, 0);
    const top = clamp(ch / 2 - y * height, ch - height, 0);
    return { width, height, left, top };
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

export function panCoverFocus(
  cw: number,
  ch: number,
  iw: number,
  ih: number,
  focus: ImageFocus | undefined,
  dx: number,
  dy: number
): ImageFocus {
  const current = layoutImageFill('cover', cw, ch, iw, ih, focus);
  const next = layoutImageFill('cover', cw, ch, iw, ih, {
    x: current.width ? (cw / 2 - (current.left + dx)) / current.width : DEFAULT_IMAGE_FOCUS.x,
    y: current.height ? (ch / 2 - (current.top + dy)) / current.height : DEFAULT_IMAGE_FOCUS.y,
  });
  return focusFromCoverLayout(cw, ch, next);
}

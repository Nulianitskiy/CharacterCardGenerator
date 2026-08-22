import { describe, expect, it } from 'vitest';
import { layoutImageFill, panCoverFocus } from './imageFillLayout';

describe('layoutImageFill', () => {
  it('returns the box when image or container size is missing', () => {
    expect(layoutImageFill('cover', 0, 100, 10, 10)).toEqual({
      width: 0,
      height: 100,
      left: 0,
      top: 0,
    });
    expect(layoutImageFill('cover', 100, 100, 0, 10)).toEqual({
      width: 100,
      height: 100,
      left: 0,
      top: 0,
    });
  });

  it('covers a landscape box by cropping vertically', () => {
    const r = layoutImageFill('cover', 200, 100, 100, 100);
    expect(r.width).toBe(200);
    expect(r.height).toBe(200);
    expect(r.left).toBe(0);
    expect(r.top).toBe(-50);
  });

  it('keeps default cover focus in the center', () => {
    const centered = layoutImageFill('cover', 200, 100, 100, 100, { x: 0.5, y: 0.5 });
    const fallback = layoutImageFill('cover', 200, 100, 100, 100);
    expect(centered).toEqual(fallback);
  });

  it('shifts cover crop toward the top of the photo', () => {
    const r = layoutImageFill('cover', 200, 100, 100, 100, { x: 0.5, y: 0 });
    expect(r.left).toBe(0);
    expect(r.top).toBe(0);
  });

  it('clamps cover focus so the image still fills the box', () => {
    const r = layoutImageFill('cover', 200, 100, 100, 100, { x: 0, y: 1 });
    expect(r.left).toBe(0);
    expect(r.top).toBe(-100);
  });

  it('ignores focus in fitWidth', () => {
    const plain = layoutImageFill('fitWidth', 200, 100, 100, 100);
    const focused = layoutImageFill('fitWidth', 200, 100, 100, 100, { x: 0, y: 0 });
    expect(focused).toEqual(plain);
    expect(plain.top).toBe(-50);
  });

  it('fits width and letterboxes vertically', () => {
    const r = layoutImageFill('fitWidth', 200, 100, 100, 100);
    expect(r.width).toBe(200);
    expect(r.height).toBe(200);
    expect(r.left).toBe(0);
    expect(r.top).toBe(-50);
  });

  it('fits height and letterboxes horizontally', () => {
    const r = layoutImageFill('fitHeight', 200, 100, 100, 100);
    expect(r.width).toBe(100);
    expect(r.height).toBe(100);
    expect(r.left).toBe(50);
    expect(r.top).toBe(0);
  });

  it('defaults undefined mode to cover', () => {
    const explicit = layoutImageFill('cover', 80, 40, 20, 20);
    const fallback = layoutImageFill(undefined, 80, 40, 20, 20);
    expect(fallback).toEqual(explicit);
  });
});

describe('panCoverFocus', () => {
  it('does not pan past the cover clamp', () => {
    const start = { x: 0.5, y: 0.5 };
    const panned = panCoverFocus(200, 100, 100, 100, start, 0, 1000);
    const layout = layoutImageFill('cover', 200, 100, 100, 100, panned);
    expect(layout.top).toBe(0);
  });
});

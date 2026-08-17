import { describe, expect, it } from 'vitest';
import { layoutImageFill } from './imageFillLayout';

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

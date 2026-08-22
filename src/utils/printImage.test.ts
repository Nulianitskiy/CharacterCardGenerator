import { describe, expect, it } from 'vitest';
import { printSourceSize } from './printImage';

describe('printSourceSize', () => {
  it('downscales a 12MP landscape photo to cover a portrait print box', () => {
    expect(printSourceSize(4000, 3000, 800, 1200)).toEqual({ width: 1600, height: 1200 });
  });

  it('keeps a small photo as-is so cover can still upscale', () => {
    expect(printSourceSize(100, 100, 800, 1200)).toEqual({ width: 100, height: 100 });
  });

  it('keeps a photo that already matches the canvas', () => {
    expect(printSourceSize(800, 1200, 800, 1200)).toEqual({ width: 800, height: 1200 });
  });

  it('returns zeros when a size is missing', () => {
    expect(printSourceSize(0, 100, 10, 10)).toEqual({ width: 0, height: 100 });
  });
});

import { get2dContext } from './canvas2d';

export interface PrintSourceSize {
  width: number;
  height: number;
}

export type PrintImage = ImageBitmap | HTMLImageElement | HTMLCanvasElement;

/**
 * Smallest source size that still covers a cw×ch print canvas (cover-scale).
 * Larger photos are downscaled; smaller ones are left as-is so we never upscale.
 */
export function printSourceSize(
  iw: number,
  ih: number,
  cw: number,
  ch: number
): PrintSourceSize {
  if (!iw || !ih || !cw || !ch) {
    return { width: Math.max(0, iw), height: Math.max(0, ih) };
  }
  const scale = Math.min(1, Math.max(cw / iw, ch / ih));
  return {
    width: Math.max(1, Math.round(iw * scale)),
    height: Math.max(1, Math.round(ih * scale)),
  };
}

const loadHtmlImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });

const downscaleViaCanvas = (
  img: HTMLImageElement,
  width: number,
  height: number
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = get2dContext(canvas);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
};

export async function loadPrintImage(
  url: string,
  canvasWidth: number,
  canvasHeight: number
): Promise<PrintImage> {
  const img = await loadHtmlImage(url);
  const { width, height } = printSourceSize(
    img.naturalWidth || img.width,
    img.naturalHeight || img.height,
    canvasWidth,
    canvasHeight
  );
  if (width === img.width && height === img.height) {
    return img;
  }
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(img, {
        resizeWidth: width,
        resizeHeight: height,
        resizeQuality: 'high',
      });
    } catch {
      return downscaleViaCanvas(img, width, height);
    }
  }
  return downscaleViaCanvas(img, width, height);
}

export const closePrintImage = (image: PrintImage): void => {
  if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) {
    image.close();
  }
};


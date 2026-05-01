import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { ImageFillMode } from '../types';
import { layoutImageFill } from '../utils/imageFillLayout';

interface FilledCharacterImageProps {
  src: string;
  alt: string;
  imageFillMode?: ImageFillMode;
  /** Classes for the inner img (e.g. side-image, card-image) */
  className?: string;
  /** Classes for the wrapping div (e.g. absolute inset-0 in grid cards) */
  wrapperClassName?: string;
}

/**
 * Renders a character image with the same fill modes as PDF (cover / fit width / fit height),
 * using measured container and intrinsic image size.
 */
export function FilledCharacterImage({
  src,
  alt,
  imageFillMode,
  className = '',
  wrapperClassName = '',
}: FilledCharacterImageProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [box, setBox] = useState<{ l: number; t: number; w: number; h: number } | null>(null);

  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    const img = imgRef.current;
    if (!wrap || !img?.naturalWidth) return;
    const r = layoutImageFill(
      imageFillMode,
      wrap.clientWidth,
      wrap.clientHeight,
      img.naturalWidth,
      img.naturalHeight
    );
    setBox({ l: r.left, t: r.top, w: r.width, h: r.height });
  }, [imageFillMode]);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [measure]);

  useLayoutEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth) measure();
  }, [measure, src]);

  const mode = imageFillMode ?? 'cover';
  const letterbox = mode !== 'cover';

  return (
    <div
      ref={wrapRef}
      className={`filled-image-wrap${letterbox ? ' filled-image-wrap-letterbox' : ''}${wrapperClassName ? ` ${wrapperClassName}` : ''}`}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={className}
        onLoad={measure}
        style={
          box
            ? {
                position: 'absolute',
                left: box.l,
                top: box.t,
                width: box.w,
                height: box.h,
              }
            : {
                position: 'absolute',
                opacity: 0,
                width: 0,
                height: 0,
                pointerEvents: 'none',
              }
        }
      />
    </div>
  );
}

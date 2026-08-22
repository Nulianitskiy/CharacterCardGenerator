import { useCallback, useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import { POINTER_DRAG_THRESHOLD_PX } from '../constants';
import type { ImageFillMode, ImageFocus } from '../types';
import { layoutImageFill, panCoverFocus } from '../utils/imageFillLayout';

interface FilledCharacterImageProps {
  src: string;
  alt: string;
  imageFillMode?: ImageFillMode;
  imageFocus?: ImageFocus;
  /** Classes for the inner img (e.g. side-image, card-image) */
  className?: string;
  /** Classes for the wrapping div (e.g. absolute inset-0 in grid cards) */
  wrapperClassName?: string;
  pannable?: boolean;
  onImageFocusChange?: (focus: ImageFocus) => void;
  onClick?: () => void;
}

/**
 * Renders a character image with the same fill modes as PDF (cover / fit width / fit height),
 * using measured container and intrinsic image size.
 */
export function FilledCharacterImage({
  src,
  alt,
  imageFillMode,
  imageFocus,
  className = '',
  wrapperClassName = '',
  pannable = false,
  onImageFocusChange,
  onClick,
}: FilledCharacterImageProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const focusRef = useRef(imageFocus);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    moved: boolean;
  } | null>(null);
  const [box, setBox] = useState<{ l: number; t: number; w: number; h: number } | null>(null);
  const [grabbing, setGrabbing] = useState(false);

  useLayoutEffect(() => {
    focusRef.current = imageFocus;
  }, [imageFocus]);

  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    const img = imgRef.current;
    if (!wrap || !img?.naturalWidth) return;
    const r = layoutImageFill(
      imageFillMode,
      wrap.clientWidth,
      wrap.clientHeight,
      img.naturalWidth,
      img.naturalHeight,
      imageFocus
    );
    setBox({ l: r.left, t: r.top, w: r.width, h: r.height });
  }, [imageFillMode, imageFocus]);

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

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!pannable || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      moved: false,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || !pannable) return;
    const dist = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    if (!drag.moved && dist < POINTER_DRAG_THRESHOLD_PX) return;
    drag.moved = true;
    setGrabbing(true);
    const dx = event.clientX - drag.lastX;
    const dy = event.clientY - drag.lastY;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    const wrap = wrapRef.current;
    const img = imgRef.current;
    if (!wrap || !img?.naturalWidth || !onImageFocusChange) return;
    onImageFocusChange(
      panCoverFocus(
        wrap.clientWidth,
        wrap.clientHeight,
        img.naturalWidth,
        img.naturalHeight,
        focusRef.current,
        dx,
        dy
      )
    );
  };

  const endPointer = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    setGrabbing(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (!drag) return;
    if (!drag.moved) onClick?.();
  };

  const mode = imageFillMode ?? 'cover';
  const letterbox = mode !== 'cover';

  return (
    <div
      ref={wrapRef}
      className={`filled-image-wrap${letterbox ? ' filled-image-wrap-letterbox' : ''}${
        pannable ? ' filled-image-wrap-pannable' : ''
      }${grabbing ? ' is-panning' : ''}${wrapperClassName ? ` ${wrapperClassName}` : ''}`}
      onPointerDown={pannable ? handlePointerDown : undefined}
      onPointerMove={pannable ? handlePointerMove : undefined}
      onPointerUp={pannable ? endPointer : undefined}
      onPointerCancel={pannable ? endPointer : undefined}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        draggable={false}
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

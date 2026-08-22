import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CARD_SIDE_LABELS, type CardSide, type CharacterCard } from '../types';
import { CardFace } from './CardFace';
import './SidePreviewModal.css';

interface SidePreviewModalProps {
  card: CharacterCard;
  side: CardSide;
  aspectRatio: number;
  onClose: () => void;
}

export function SidePreviewModal({ card, side, aspectRatio, onClose }: SidePreviewModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onClose();
    };

    document.addEventListener('keydown', onKeyDown, true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div className="side-preview-modal" onClick={onClose}>
      <div
        className="side-preview-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="side-preview-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="side-preview-dialog-header">
          <h2 id="side-preview-title" className="side-preview-dialog-title">
            {CARD_SIDE_LABELS[side]}
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="side-preview-dialog-close"
            onClick={onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
        <div
          className="side-preview-dialog-face"
          style={{
            aspectRatio,
            width: `min(88vw, calc(82vh * ${aspectRatio}))`,
          }}
        >
          <CardFace card={card} side={side} />
        </div>
      </div>
    </div>,
    document.body
  );
}

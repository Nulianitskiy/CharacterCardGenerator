import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CARD_SIDE_LABELS, type CardSide, type CharacterCard, type GameObject } from '../types';
import type { CardsPerPageOption } from '../constants';
import type { ObjectFaceSide } from '../utils/objectLayout';
import { CardSideFrame } from './CardSideFrame';
import { ObjectDescriptionFace, ObjectShirtFace } from './ObjectFaces';
import './SidePreviewModal.css';

interface SidePreviewModalProps {
  card: CharacterCard;
  side: CardSide;
  aspectRatio: number;
  cardsPerPage: CardsPerPageOption;
  onClose: () => void;
}

export function SidePreviewModal({ card, side, aspectRatio, cardsPerPage, onClose }: SidePreviewModalProps) {
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
          <CardSideFrame card={card} side={side} cardsPerPage={cardsPerPage} />
        </div>
      </div>
    </div>,
    document.body
  );
}

interface ObjectPreviewModalProps {
  object: GameObject;
  side: ObjectFaceSide;
  aspectRatio: number;
  onClose: () => void;
}

export function ObjectPreviewModal({
  object,
  side,
  aspectRatio,
  onClose,
}: ObjectPreviewModalProps) {
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

  const title = side === 'shirt' ? 'Рубашка предмета' : 'Описание предмета';

  return createPortal(
    <div className="side-preview-modal" onClick={onClose}>
      <div
        className="side-preview-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="object-preview-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="side-preview-dialog-header">
          <h2 id="object-preview-title" className="side-preview-dialog-title">
            {title}
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
          className="side-preview-dialog-face side-preview-dialog-face-object"
          style={{
            aspectRatio,
            width: `min(88vw, calc(82vh * ${aspectRatio}))`,
          }}
        >
          {side === 'shirt' ? (
            <ObjectShirtFace object={object} />
          ) : (
            <ObjectDescriptionFace object={object} />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

import { useState, type DragEvent, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { CARD_SIDE_LABELS, type CardSide, type CharacterCard } from '../types';
import { getSheetSideAspect, isPawnLayout, type CardsPerPageOption } from '../constants';
import { getPawnCellSpan, getPawnPreviewAspect, resolvePawnSize } from '../utils/pawnLayout';
import { CardSideFrame } from './CardSideFrame';
import './Card.css';

interface CardProps {
  card: CharacterCard;
  cardsPerPage: CardsPerPageOption;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
  onPointerDragStart: (event: PointerEvent<HTMLElement>, id: string) => void;
  onFilesDropped: (id: string, files: File[]) => void;
}

function HoverTip({
  card,
  side,
  aspectRatio,
  cardsPerPage,
}: {
  card: CharacterCard;
  side: CardSide;
  aspectRatio: number;
  cardsPerPage: CardsPerPageOption;
}) {
  return (
    <div className="card-hover-tip">
      <span className="card-hover-tip-label">{CARD_SIDE_LABELS[side]}</span>
      <div className="card-hover-tip-face" style={{ aspectRatio }}>
        <CardSideFrame card={card} side={side} cardsPerPage={cardsPerPage} />
      </div>
    </div>
  );
}

const isFileDrag = (event: DragEvent): boolean =>
  Array.from(event.dataTransfer?.types ?? []).includes('Files');

export function Card({
  card,
  cardsPerPage,
  onRemove,
  onSelect,
  isSelected,
  onPointerDragStart,
  onFilesDropped,
}: CardProps) {
  const pawnSize = resolvePawnSize(card);
  const isPawn = isPawnLayout(cardsPerPage);
  const aspectRatio = isPawn
    ? getPawnPreviewAspect(cardsPerPage, pawnSize)
    : getSheetSideAspect(cardsPerPage);
  const isHugePawn = isPawn && getPawnCellSpan(pawnSize).rows > 1;
  const [fileOver, setFileOver] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);

  const handleRemove = (e: MouseEvent) => {
    e.stopPropagation();
    onRemove(card.id);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(card.id);
    }
  };

  const handlePointerDown = (e: PointerEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest('.card-remove')) return;
    onPointerDragStart(e, card.id);
  };

  const handleDragEnter = (e: DragEvent<HTMLElement>) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    e.stopPropagation();
    setFileOver(true);
  };

  const handleDragOver = (e: DragEvent<HTMLElement>) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: DragEvent<HTMLElement>) => {
    if (!isFileDrag(e)) return;
    const next = e.relatedTarget;
    if (next instanceof Node && e.currentTarget.contains(next)) return;
    setFileOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLElement>) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    e.stopPropagation();
    setFileOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onFilesDropped(card.id, files);
  };

  return (
    <div
      className={`card-wrap${fileOver ? ' card-wrap-file-over' : ''}${isHugePawn ? ' card-wrap-huge' : ''}`}
      data-card-id={card.id}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setTipsOpen(true);
      }}
      onPointerLeave={() => setTipsOpen(false)}
    >
      {tipsOpen && (
        <div className="card-hover-tips" aria-hidden="true">
          <HoverTip card={card} side="a" aspectRatio={aspectRatio} cardsPerPage={cardsPerPage} />
          <HoverTip card={card} side="b" aspectRatio={aspectRatio} cardsPerPage={cardsPerPage} />
        </div>
      )}
      <article
        className={`card ${isSelected ? 'card-selected' : ''}${fileOver ? ' card-file-drop' : ''}${isHugePawn ? ' card-pawn-huge' : ''}`}
        style={{ aspectRatio }}
        onClick={() => onSelect(card.id)}
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        aria-pressed={isSelected}
        aria-label={card.nameSettings.name.trim() || (isHugePawn ? 'Огромный павн' : 'Карточка персонажа')}
      >
        <CardSideFrame card={card} side="a" cardsPerPage={cardsPerPage} />
        <button
          type="button"
          className="card-remove"
          onClick={handleRemove}
          aria-label="Удалить карточку"
        >
          ×
        </button>
      </article>
    </div>
  );
}

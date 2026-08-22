import type { KeyboardEvent, MouseEvent } from 'react';
import { CARD_SIDE_LABELS, type CardSide, type CharacterCard } from '../types';
import { getHangingPortraitAspect, type CardsPerPageOption } from '../constants';
import { CardFace } from './CardFace';
import './Card.css';

interface CardProps {
  card: CharacterCard;
  cardsPerPage: CardsPerPageOption;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
}

function HoverTip({
  card,
  side,
  aspectRatio,
}: {
  card: CharacterCard;
  side: CardSide;
  aspectRatio: number;
}) {
  return (
    <div className="card-hover-tip">
      <span className="card-hover-tip-label">{CARD_SIDE_LABELS[side]}</span>
      <div className="card-hover-tip-face" style={{ aspectRatio }}>
        <CardFace card={card} side={side} />
      </div>
    </div>
  );
}

export function Card({ card, cardsPerPage, onRemove, onSelect, isSelected }: CardProps) {
  const aspectRatio = getHangingPortraitAspect(cardsPerPage);

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

  return (
    <div className="card-wrap">
      <div className="card-hover-tips" aria-hidden="true">
        <HoverTip card={card} side="a" aspectRatio={aspectRatio} />
        <HoverTip card={card} side="b" aspectRatio={aspectRatio} />
      </div>
      <article
        className={`card ${isSelected ? 'card-selected' : ''}`}
        style={{ aspectRatio }}
        onClick={() => onSelect(card.id)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        aria-pressed={isSelected}
        aria-label={card.nameSettings.name.trim() || 'Карточка персонажа'}
      >
        <CardFace card={card} side="a" />
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

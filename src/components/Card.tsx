import type { KeyboardEvent, MouseEvent } from 'react';
import type { CharacterCard } from '../types';
import { CardFace } from './CardFace';
import './Card.css';

interface CardProps {
  card: CharacterCard;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
}

export function Card({ card, onRemove, onSelect, isSelected }: CardProps) {
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
    <article
      className={`card ${isSelected ? 'card-selected' : ''}`}
      onClick={() => onSelect(card.id)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label="Карточка персонажа"
    >
      <div className="card-halves">
        <div className="card-half">
          <div className="card-half-portrait card-half-portrait-gm">
            <CardFace card={card} side="gm" />
          </div>
        </div>
        <div className="card-fold" aria-hidden="true" />
        <div className="card-half">
          <div className="card-half-portrait card-half-portrait-player">
            <CardFace card={card} side="player" />
          </div>
        </div>
      </div>
      <button
        type="button"
        className="card-remove"
        onClick={handleRemove}
        aria-label="Удалить карточку"
      >
        ×
      </button>
    </article>
  );
}

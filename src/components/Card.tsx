import type { CharacterCard } from '../types';
import { FilledCharacterImage } from './FilledCharacterImage';

interface CardProps {
  card: CharacterCard;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
}

/**
 * Simple card component that displays the uploaded character image
 */
export function Card({ card, onRemove, onSelect, isSelected }: CardProps) {
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    URL.revokeObjectURL(card.imageUrl);
    onRemove(card.id);
  };

  const handleClick = () => {
    onSelect(card.id);
  };

  return (
    <div
      className={`card ${isSelected ? 'card-selected' : ''}`}
      onClick={handleClick}
    >
      <FilledCharacterImage
        src={card.imageUrl}
        alt="Character"
        imageFillMode={card.imageFillMode}
        className="card-image"
        wrapperClassName="card-image-wrap"
      />
      <button
        className="card-remove"
        onClick={handleRemove}
        aria-label="Remove card"
      >
        ×
      </button>
    </div>
  );
}

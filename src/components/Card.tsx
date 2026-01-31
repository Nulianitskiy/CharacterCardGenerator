import type { CharacterCard } from '../types';

interface CardProps {
  card: CharacterCard;
  onRemove: (id: string) => void;
}

/**
 * Simple card component that displays the uploaded character image
 */
export function Card({ card, onRemove }: CardProps) {
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    URL.revokeObjectURL(card.imageUrl);
    onRemove(card.id);
  };

  return (
    <div className="card">
      <img src={card.imageUrl} alt="Character" className="card-image" />
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

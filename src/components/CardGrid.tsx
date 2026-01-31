import type { CharacterCard } from '../types';
import { Card } from './Card';

interface CardGridProps {
  cards: CharacterCard[];
  onRemoveCard: (id: string) => void;
}

/**
 * Grid layout component that displays all uploaded character images
 */
export function CardGrid({ cards, onRemoveCard }: CardGridProps) {
  if (cards.length === 0) {
    return (
      <div className="grid-empty">
        <p>No cards yet. Upload some character images to get started!</p>
      </div>
    );
  }

  return (
    <div className="card-grid">
      {cards.map((card) => (
        <Card key={card.id} card={card} onRemove={onRemoveCard} />
      ))}
    </div>
  );
}

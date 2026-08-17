import type { CharacterCard } from '../types';
import { Card } from './Card';

interface CardGridProps {
  cards: CharacterCard[];
  onRemoveCard: (id: string) => void;
  onSelectCard: (id: string) => void;
  selectedCardId: string | null;
}

/**
 * Grid layout component that displays all uploaded character images
 */
export function CardGrid({
  cards,
  onRemoveCard,
  onSelectCard,
  selectedCardId,
}: CardGridProps) {
  if (cards.length === 0) {
    return (
      <div className="grid-empty">
        <p>Пока нет карточек. Загрузите изображения персонажей, чтобы начать!</p>
      </div>
    );
  }

  return (
    <div className="card-grid">
      {cards.map((card) => (
        <Card
          key={card.id}
          card={card}
          onRemove={onRemoveCard}
          onSelect={onSelectCard}
          isSelected={card.id === selectedCardId}
        />
      ))}
    </div>
  );
}

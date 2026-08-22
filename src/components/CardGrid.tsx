import type { CharacterCard } from '../types';
import { getHangingPortraitAspect, type CardsPerPageOption } from '../constants';
import { Card } from './Card';
import { ImageUpload } from './ImageUpload';
import './CardGrid.css';

interface CardGridProps {
  cards: CharacterCard[];
  cardsPerPage: CardsPerPageOption;
  onRemoveCard: (id: string) => void;
  onSelectCard: (id: string) => void;
  onImagesUploaded: (cards: CharacterCard[]) => void;
  selectedCardId: string | null;
}

export function CardGrid({
  cards,
  cardsPerPage,
  onRemoveCard,
  onSelectCard,
  onImagesUploaded,
  selectedCardId,
}: CardGridProps) {
  if (cards.length === 0) {
    return <ImageUpload variant="zone" onImagesUploaded={onImagesUploaded} />;
  }

  return (
    <div className="card-grid">
      {cards.map((card) => (
        <Card
          key={card.id}
          card={card}
          cardsPerPage={cardsPerPage}
          onRemove={onRemoveCard}
          onSelect={onSelectCard}
          isSelected={card.id === selectedCardId}
        />
      ))}
      <ImageUpload
        variant="tile"
        aspectRatio={getHangingPortraitAspect(cardsPerPage)}
        onImagesUploaded={onImagesUploaded}
      />
    </div>
  );
}

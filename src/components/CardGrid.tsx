import type { CharacterCard } from '../types';
import type { CardsPerPageOption } from '../constants';
import { Card } from './Card';
import './CardGrid.css';

interface CardGridProps {
  cards: CharacterCard[];
  cardsPerPage: CardsPerPageOption;
  onRemoveCard: (id: string) => void;
  onSelectCard: (id: string) => void;
  selectedCardId: string | null;
}

export function CardGrid({
  cards,
  cardsPerPage,
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

  const pageCount = Math.ceil(cards.length / cardsPerPage);

  return (
    <div className="page-previews">
      {Array.from({ length: pageCount }, (_, pageIndex) => {
        const start = pageIndex * cardsPerPage;
        const pageCards = cards.slice(start, start + cardsPerPage);

        return (
          <section
            key={pageIndex}
            className="a4-page"
            aria-label={`Страница ${pageIndex + 1} из ${pageCount}`}
          >
            <p className="a4-page-label">
              Страница {pageIndex + 1} из {pageCount}
            </p>
            <div className={`a4-sheet a4-sheet-${cardsPerPage}`}>
              {Array.from({ length: cardsPerPage }, (_, slot) => {
                const card = pageCards[slot];
                if (!card) {
                  return <div key={`empty-${slot}`} className="card-slot-empty" />;
                }
                return (
                  <Card
                    key={card.id}
                    card={card}
                    onRemove={onRemoveCard}
                    onSelect={onSelectCard}
                    isSelected={card.id === selectedCardId}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

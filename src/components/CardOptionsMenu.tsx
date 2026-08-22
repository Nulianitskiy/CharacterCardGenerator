import type {
  CharacterCard,
  NameSettings,
  ImageFillMode,
  DndStatsSettings,
  ImageFocus,
} from '../types';
import type { CardsPerPageOption } from '../constants';
import { CardOptionsPreview } from './cardOptions/CardOptionsPreview';
import { CardOptionsNameSection } from './cardOptions/CardOptionsNameSection';
import { CardOptionsDndSection } from './cardOptions/CardOptionsDndSection';
import { CardOptionsActions } from './cardOptions/CardOptionsActions';
import './CardOptionsMenu.css';

interface CardOptionsMenuProps {
  card: CharacterCard;
  cardsPerPage: CardsPerPageOption;
  onClose: () => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onUpdateNameSettings: (id: string, settings: NameSettings) => void;
  onUpdateImageFillMode: (id: string, mode: ImageFillMode) => void;
  onUpdateImageFocus: (id: string, focus: ImageFocus) => void;
  onUpdateDndStats: (id: string, stats: DndStatsSettings) => void;
  onReplaceImage: (id: string, files: File[]) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export function CardOptionsMenu({
  card,
  cardsPerPage,
  onClose,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onUpdateNameSettings,
  onUpdateImageFillMode,
  onUpdateImageFocus,
  onUpdateDndStats,
  onReplaceImage,
  canMoveUp,
  canMoveDown,
}: CardOptionsMenuProps) {
  return (
    <div className="card-options-menu">
      <div className="options-header">
        <h3 className="options-title">Параметры карточки</h3>
        <button
          type="button"
          className="options-close"
          onClick={onClose}
          aria-label="Закрыть меню"
        >
          ×
        </button>
      </div>

      <CardOptionsPreview
        card={card}
        cardsPerPage={cardsPerPage}
        onUpdateImageFillMode={onUpdateImageFillMode}
        onUpdateImageFocus={onUpdateImageFocus}
      />
      <CardOptionsNameSection card={card} onUpdateNameSettings={onUpdateNameSettings} />
      <CardOptionsDndSection
        card={card}
        onUpdateNameSettings={onUpdateNameSettings}
        onUpdateDndStats={onUpdateDndStats}
      />
      <CardOptionsActions
        card={card}
        onClose={onClose}
        onRemove={onRemove}
        onDuplicate={onDuplicate}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onReplaceImage={onReplaceImage}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
      />
    </div>
  );
}

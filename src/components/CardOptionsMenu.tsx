import type {
  CharacterCard,
  NameSettings,
  ImageFillMode,
  DndStatsSettings,
  ImageFocus,
  PawnSize,
} from '../types';
import { DEFAULT_PAWN_SIZE } from '../types';
import { isPawnLayout, type CardsPerPageOption } from '../constants';
import { CardOptionsPreview } from './cardOptions/CardOptionsPreview';
import { CardOptionsNameSection } from './cardOptions/CardOptionsNameSection';
import { CardOptionsDndSection } from './cardOptions/CardOptionsDndSection';
import { CardOptionsActions } from './cardOptions/CardOptionsActions';
import { PAWN_SIZE_OPTIONS } from './cardOptions/optionLists';
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
  onUpdatePawnSize: (id: string, size: PawnSize) => void;
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
  onUpdatePawnSize,
  onReplaceImage,
  canMoveUp,
  canMoveDown,
}: CardOptionsMenuProps) {
  const pawn = isPawnLayout(cardsPerPage);
  const pawnSize = card.pawnSize ?? DEFAULT_PAWN_SIZE;

  return (
    <div className="card-options-menu">
      <div className="options-header">
        <h3 className="options-title">{pawn ? 'Параметры павна' : 'Параметры карточки'}</h3>
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
      {pawn && (
        <div className="options-section">
          <div className="setting-row">
            <span className="setting-label">Размер</span>
            <div className="fill-mode-options">
              {PAWN_SIZE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`fill-mode-option ${pawnSize === option.value ? 'active' : ''}`}
                  onClick={() => onUpdatePawnSize(card.id, option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="setting-hint">Большой — две клетки в ширину. Огромный — в два раза больше среднего</p>
          </div>
        </div>
      )}
      {!pawn && (
        <CardOptionsNameSection card={card} onUpdateNameSettings={onUpdateNameSettings} />
      )}
      {!pawn && (
        <CardOptionsDndSection
          card={card}
          onUpdateNameSettings={onUpdateNameSettings}
          onUpdateDndStats={onUpdateDndStats}
        />
      )}
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

import { useCallback, useState, type KeyboardEvent } from 'react';
import { CARD_SIDE_LABELS, type CardSide, type CharacterCard, type ImageFillMode, type ImageFocus } from '../../types';
import { getHangingPortraitAspect, type CardsPerPageOption } from '../../constants';
import { CardFace } from '../CardFace';
import { SidePreviewModal } from '../SidePreviewModal';
import { IMAGE_FILL_OPTIONS } from './optionLists';

function SidePreview({
  card,
  side,
  label,
  aspectRatio,
  onOpen,
  onImageFocusChange,
}: {
  card: CharacterCard;
  side: CardSide;
  label: string;
  aspectRatio: number;
  onOpen: (side: CardSide) => void;
  onImageFocusChange: (focus: ImageFocus) => void;
}) {
  const isStats = Boolean(card.dndStats?.enabled && card.dndStats.displaySide === side);
  const canPan = !isStats && (card.imageFillMode ?? 'cover') === 'cover';
  const open = () => onOpen(side);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open();
    }
  };

  return (
    <div
      className={`preview-side${canPan ? ' preview-side-pannable' : ''}`}
      role={canPan ? undefined : 'button'}
      tabIndex={canPan ? undefined : 0}
      onClick={canPan ? undefined : open}
      onKeyDown={canPan ? undefined : handleKeyDown}
      title={canPan ? 'Перетащите превью, чтобы сдвинуть кадр' : 'Открыть в полном размере'}
    >
      {canPan ? (
        <button type="button" className="side-label-btn" onClick={open} title="Открыть в полном размере">
          <span className="side-label">{label}</span>
        </button>
      ) : (
        <span className="side-label">{label}</span>
      )}
      <div className="side-image-container" style={{ aspectRatio }}>
        <CardFace
          card={card}
          side={side}
          imageClassName="side-image"
          pannable={canPan}
          onImageFocusChange={canPan ? onImageFocusChange : undefined}
          onPortraitClick={canPan ? open : undefined}
        />
      </div>
    </div>
  );
}

interface CardOptionsPreviewProps {
  card: CharacterCard;
  cardsPerPage: CardsPerPageOption;
  onUpdateImageFillMode: (id: string, mode: ImageFillMode) => void;
  onUpdateImageFocus: (id: string, focus: ImageFocus) => void;
}

export function CardOptionsPreview({
  card,
  cardsPerPage,
  onUpdateImageFillMode,
  onUpdateImageFocus,
}: CardOptionsPreviewProps) {
  const imageFillMode = card.imageFillMode ?? 'cover';
  const hangingAspect = getHangingPortraitAspect(cardsPerPage);
  const [previewSide, setPreviewSide] = useState<CardSide | null>(null);
  const closePreview = useCallback(() => setPreviewSide(null), []);

  return (
    <>
      <div className="options-preview">
        <div className="preview-sides">
          <SidePreview
            card={card}
            side="a"
            label={CARD_SIDE_LABELS.a}
            aspectRatio={hangingAspect}
            onOpen={setPreviewSide}
            onImageFocusChange={(focus) => onUpdateImageFocus(card.id, focus)}
          />
          <SidePreview
            card={card}
            side="b"
            label={CARD_SIDE_LABELS.b}
            aspectRatio={hangingAspect}
            onOpen={setPreviewSide}
            onImageFocusChange={(focus) => onUpdateImageFocus(card.id, focus)}
          />
        </div>
      </div>

      {previewSide && (
        <SidePreviewModal
          card={card}
          side={previewSide}
          aspectRatio={hangingAspect}
          onClose={closePreview}
        />
      )}

      <div className="options-section">
        <div className="setting-row">
          <span className="setting-label">Заполнение</span>
          <div className="fill-mode-options">
            {IMAGE_FILL_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`fill-mode-option ${imageFillMode === option.value ? 'active' : ''}`}
                onClick={() => onUpdateImageFillMode(card.id, option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          {imageFillMode === 'cover' && (
            <p className="setting-hint">Перетащите превью, чтобы сдвинуть кадр</p>
          )}
        </div>
      </div>
    </>
  );
}

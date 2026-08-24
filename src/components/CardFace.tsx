import { CARD_SIDE_LABELS, type CardSide, type CharacterCard, type ImageFocus } from '../types';
import { DndStatsPanel } from './DndStatsPanel';
import { FilledCharacterImage } from './FilledCharacterImage';
import { PresetOverlay } from './PresetOverlay';

interface CardFaceProps {
  card: CharacterCard;
  side: CardSide;
  imageClassName?: string;
  pannable?: boolean;
  overlaysEnabled?: boolean;
  onImageFocusChange?: (focus: ImageFocus) => void;
  onPortraitClick?: () => void;
}

export function CardFace({
  card,
  side,
  imageClassName = 'card-image',
  pannable = false,
  overlaysEnabled = true,
  onImageFocusChange,
  onPortraitClick,
}: CardFaceProps) {
  const stats = card.dndStats;
  const showStats = overlaysEnabled && Boolean(stats?.enabled && stats.displaySide === side);

  if (showStats && stats) {
    return (
      <DndStatsPanel
        stats={stats}
        name={card.nameSettings.name}
        font={card.nameSettings.font}
      />
    );
  }

  const showName =
    overlaysEnabled &&
    card.nameSettings.enabled &&
    card.nameSettings.name.trim() !== '' &&
    (card.nameSettings.displaySide === side || card.nameSettings.displaySide === 'both');

  return (
    <>
      <FilledCharacterImage
        src={card.imageUrl}
        alt={CARD_SIDE_LABELS[side]}
        imageFillMode={card.imageFillMode}
        imageFocus={card.imageFocus}
        className={imageClassName}
        wrapperClassName="card-image-wrap"
        pannable={pannable}
        onImageFocusChange={onImageFocusChange}
        onClick={onPortraitClick}
      />
      {showName && (
        <PresetOverlay
          preset={card.nameSettings.background}
          name={card.nameSettings.name}
          font={card.nameSettings.font}
          blockSize={card.nameSettings.blockSize}
        />
      )}
    </>
  );
}

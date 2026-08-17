import type { CharacterCard } from '../types';
import { FilledCharacterImage } from './FilledCharacterImage';
import { PresetOverlay } from './PresetOverlay';

interface CardFaceProps {
  card: CharacterCard;
  side: 'player' | 'gm';
  imageClassName?: string;
}

export function CardFace({
  card,
  side,
  imageClassName = 'card-image',
}: CardFaceProps) {
  const showName =
    card.nameSettings.enabled &&
    card.nameSettings.name.trim() !== '' &&
    (card.nameSettings.displaySide === side || card.nameSettings.displaySide === 'both');

  return (
    <>
      <FilledCharacterImage
        src={card.imageUrl}
        alt={side === 'player' ? 'Сторона игрока' : 'Сторона мастера'}
        imageFillMode={card.imageFillMode}
        className={imageClassName}
        wrapperClassName="card-image-wrap"
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

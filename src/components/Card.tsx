import type { CharacterCard } from '../types';
import { FilledCharacterImage } from './FilledCharacterImage';
import { PresetOverlay } from './PresetOverlay';
import { isPresetBackground } from '../utils/presetOverlays';

interface CardProps {
  card: CharacterCard;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
}

/**
 * Simple card component that displays the uploaded character image
 */
export function Card({ card, onRemove, onSelect, isSelected }: CardProps) {
  const hasPreset =
    card.nameSettings.enabled &&
    (card.nameSettings.displaySide === 'player' || card.nameSettings.displaySide === 'both') &&
    isPresetBackground(card.nameSettings.background);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    URL.revokeObjectURL(card.imageUrl);
    onRemove(card.id);
  };

  const handleClick = () => {
    onSelect(card.id);
  };

  return (
    <div
      className={`card ${isSelected ? 'card-selected' : ''} ${hasPreset ? 'has-preset' : ''}`}
      onClick={handleClick}
    >
      <FilledCharacterImage
        src={card.imageUrl}
        alt="Персонаж"
        imageFillMode={card.imageFillMode}
        className="card-image"
        wrapperClassName="card-image-wrap"
      />
      {hasPreset && (
        <PresetOverlay
          preset={card.nameSettings.background}
          name={card.nameSettings.name}
          font={card.nameSettings.font}
          blockSize={card.nameSettings.blockSize}
        />
      )}
      <button
        className="card-remove"
        onClick={handleRemove}
        aria-label="Удалить карточку"
      >
        ×
      </button>
    </div>
  );
}

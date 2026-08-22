import { useRef, type ChangeEvent } from 'react';
import { ACCEPTED_IMAGE_EXTENSIONS } from '../../constants';
import type { CharacterCard } from '../../types';

interface CardOptionsActionsProps {
  card: CharacterCard;
  onClose: () => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onReplaceImage: (id: string, files: File[]) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export function CardOptionsActions({
  card,
  onClose,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onReplaceImage,
  canMoveUp,
  canMoveDown,
}: CardOptionsActionsProps) {
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const handleReplaceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    event.target.value = '';
    if (files.length > 0) onReplaceImage(card.id, files);
  };

  const handleRemove = () => {
    onRemove(card.id);
    onClose();
  };

  return (
    <div className="options-actions">
      <input
        ref={replaceInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_EXTENSIONS}
        className="replace-image-input"
        onChange={handleReplaceChange}
      />
      <button
        type="button"
        className="option-btn"
        onClick={() => replaceInputRef.current?.click()}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21,15 16,10 5,21" />
        </svg>
        Заменить изображение
      </button>

      <button
        type="button"
        className="option-btn"
        onClick={() => onMoveUp(card.id)}
        disabled={!canMoveUp}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="18,15 12,9 6,15" />
        </svg>
        Выше
      </button>

      <button
        type="button"
        className="option-btn"
        onClick={() => onMoveDown(card.id)}
        disabled={!canMoveDown}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6,9 12,15 18,9" />
        </svg>
        Ниже
      </button>

      <button type="button" className="option-btn" onClick={() => onDuplicate(card.id)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        Дублировать
      </button>

      <button type="button" className="option-btn option-btn-danger" onClick={handleRemove}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3,6 5,6 21,6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
        Удалить
      </button>
    </div>
  );
}

import { useRef, useState, type ChangeEvent } from 'react';
import {
  ACCEPTED_IMAGE_EXTENSIONS,
  OBJECT_PALETTES,
  getGameObjectCellHeight,
  getGameObjectCellWidth,
} from '../constants';
import type { GameObject, ObjectTheme } from '../types';
import { OBJECT_THEME_OPTIONS } from './cardOptions/optionLists';
import { ObjectDescriptionFace, ObjectShirtFace } from './ObjectFaces';
import './ObjectOptionsMenu.css';

/** Face aspect for the live preview pair; kept identical to the sheet layout. */
const FACE_ASPECT = getGameObjectCellWidth() / getGameObjectCellHeight();

export type ObjectPatch = Partial<
  Pick<GameObject, 'name' | 'slogan' | 'description' | 'quantity' | 'theme'>
>;

interface ObjectOptionsMenuProps {
  object: GameObject;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onClose: () => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onUpdate: (id: string, patch: ObjectPatch) => void;
  onReplaceImage: (id: string, files: File[]) => void;
}

export function ObjectOptionsMenu({
  object,
  canMoveUp,
  canMoveDown,
  onClose,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onUpdate,
  onReplaceImage,
}: ObjectOptionsMenuProps) {
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [hasQuantity, setHasQuantity] = useState(object.quantity !== null);

  const patch = (values: ObjectPatch) => onUpdate(object.id, values);

  const handleReplaceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    event.target.value = '';
    if (files.length > 0) onReplaceImage(object.id, files);
  };

  const handleRemove = () => {
    onRemove(object.id);
    onClose();
  };

  return (
    <div className="object-options-menu">
      <div className="options-header">
        <h3 className="options-title">Параметры объекта</h3>
        <button type="button" className="options-close" onClick={onClose} aria-label="Закрыть меню">
          ×
        </button>
      </div>

      <div className="object-preview">
        <div
          className="object-pair object-pair-preview"
          style={{ aspectRatio: `${2 * FACE_ASPECT} / 1` }}
        >
          <div className="object-pair-face" style={{ aspectRatio: `${FACE_ASPECT}` }}>
            <ObjectShirtFace object={object} />
          </div>
          <div className="object-pair-face" style={{ aspectRatio: `${FACE_ASPECT}` }}>
            <ObjectDescriptionFace object={object} />
          </div>
        </div>
      </div>

      <div className="options-section">
        <div className="setting-row">
          <label className="setting-label" htmlFor="object-name">
            Название
          </label>
          <input
            id="object-name"
            type="text"
            className="setting-input"
            value={object.name}
            onChange={(event) => patch({ name: event.target.value })}
            placeholder="Например, Зелье невидимости"
          />
        </div>

        <div className="setting-row">
          <label className="setting-label" htmlFor="object-slogan">
            Слоган (рубашка)
          </label>
          <textarea
            id="object-slogan"
            className="setting-textarea"
            rows={2}
            value={object.slogan}
            onChange={(event) => patch({ slogan: event.target.value })}
            placeholder="Короткая надпись на свитке. Пусто — свиток не печатается"
          />
        </div>

        <div className="setting-row">
          <label className="setting-label" htmlFor="object-description">
            Описание
          </label>
          <textarea
            id="object-description"
            className="setting-textarea setting-textarea-tall"
            rows={8}
            value={object.description}
            onChange={(event) => patch({ description: event.target.value })}
            placeholder="Текст, который напечатается в рамке. Длинный текст уменьшает кегль автоматически"
          />
        </div>
      </div>

      <div className="options-section">
        <div className="setting-row">
          <label className="setting-label setting-checkbox-row">
            <input
              type="checkbox"
              checked={hasQuantity}
              onChange={(event) => {
                const checked = event.target.checked;
                setHasQuantity(checked);
                patch({ quantity: checked ? (object.quantity ?? 1) : null });
              }}
            />
            <span>Бейдж количества</span>
          </label>
          {hasQuantity && (
            <input
              type="number"
              className="setting-input setting-input-narrow"
              min={0}
              step={1}
              value={object.quantity ?? 1}
              onChange={(event) => {
                const parsed = Number.parseInt(event.target.value, 10);
                patch({ quantity: Number.isFinite(parsed) ? Math.max(0, parsed) : 0 });
              }}
              aria-label="Количество"
            />
          )}
        </div>

        <div className="setting-row">
          <span className="setting-label">Тема</span>
          <div className="fill-mode-options">
            {OBJECT_THEME_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`theme-option ${object.theme === option.value ? 'active' : ''}`}
                onClick={() => patch({ theme: option.value as ObjectTheme })}
              >
                <span
                  className="theme-swatch"
                  style={{
                    background: OBJECT_PALETTES[option.value].cardBg,
                    borderColor: OBJECT_PALETTES[option.value].accent,
                  }}
                />
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="options-actions">
        <input
          ref={replaceInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_EXTENSIONS}
          className="replace-image-input"
          onChange={handleReplaceChange}
        />
        <button type="button" className="option-btn" onClick={() => replaceInputRef.current?.click()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21,15 16,10 5,21" />
          </svg>
          Заменить изображение
        </button>

        <button type="button" className="option-btn" onClick={() => onMoveUp(object.id)} disabled={!canMoveUp}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="18,15 12,9 6,15" />
          </svg>
          Выше
        </button>

        <button type="button" className="option-btn" onClick={() => onMoveDown(object.id)} disabled={!canMoveDown}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6,9 12,15 18,9" />
          </svg>
          Ниже
        </button>

        <button type="button" className="option-btn" onClick={() => onDuplicate(object.id)}>
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
    </div>
  );
}

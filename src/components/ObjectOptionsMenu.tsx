import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  ACCEPTED_IMAGE_EXTENSIONS,
  OBJECT_PALETTES,
  getGameObjectCellHeight,
  getGameObjectCellWidth,
} from '../constants';
import type { GameObject, ImageFillMode, ObjectTheme } from '../types';
import { fitObjectPreviewTypography, type ObjectFaceSide } from '../utils/objectLayout';
import { IMAGE_FILL_OPTIONS, OBJECT_THEME_OPTIONS } from './cardOptions/optionLists';
import { ObjectDescriptionFace, ObjectShirtFace } from './ObjectFaces';
import { ObjectPreviewModal } from './SidePreviewModal';
import './ObjectOptionsMenu.css';

/** Face aspect for the live preview pair; kept identical to the sheet layout. */
const FACE_ASPECT = getGameObjectCellWidth() / getGameObjectCellHeight();

export type ObjectPatch = Partial<
  Pick<
    GameObject,
    | 'name'
    | 'slogan'
    | 'description'
    | 'quantity'
    | 'theme'
    | 'imageFillMode'
    | 'imageFocus'
    | 'stat'
    | 'weight'
    | 'price'
    | 'attunement'
  >
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
  const [previewSide, setPreviewSide] = useState<ObjectFaceSide | null>(null);
  const imageFillMode: ImageFillMode = object.imageFillMode ?? 'cover';

  const fitted = useMemo(
    () =>
      fitObjectPreviewTypography({
        name: object.name,
        slogan: object.slogan,
        description: object.description,
        quantity: object.quantity,
        stat: object.stat,
        weight: object.weight,
        price: object.price,
        attunement: object.attunement,
      }),
    [
      object.name,
      object.slogan,
      object.description,
      object.quantity,
      object.stat,
      object.weight,
      object.price,
      object.attunement,
    ]
  );

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

      <div className="options-preview">
        <div className="preview-sides">
          <div
            className={`preview-side${imageFillMode === 'cover' ? ' preview-side-pannable' : ''}`}
            title={
              imageFillMode === 'cover'
                ? 'Перетащите превью, чтобы сдвинуть кадр (клик — увеличить)'
                : 'Открыть в полном размере'
            }
            onClick={imageFillMode === 'cover' ? undefined : () => setPreviewSide('shirt')}
          >
            <button
              type="button"
              className="side-label-btn"
              onClick={() => setPreviewSide('shirt')}
              title="Открыть в полном размере"
            >
              <span className="side-label">Рубашка</span>
            </button>
            <div
              className="object-side-container"
              style={{ aspectRatio: `${FACE_ASPECT}` }}
            >
              <ObjectShirtFace
                object={object}
                pannable={imageFillMode === 'cover'}
                onImageFocusChange={(imageFocus) => patch({ imageFocus })}
                onImageClick={() => setPreviewSide('shirt')}
              />
            </div>
          </div>

          <div
            className="preview-side"
            role="button"
            tabIndex={0}
            title="Открыть в полном размере"
            onClick={() => setPreviewSide('description')}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setPreviewSide('description');
              }
            }}
          >
            <span className="side-label">Описание</span>
            <div
              className="object-side-container"
              style={{ aspectRatio: `${FACE_ASPECT}` }}
            >
              <ObjectDescriptionFace object={object} />
            </div>
          </div>
        </div>
      </div>

      {previewSide && (
        <ObjectPreviewModal
          object={object}
          side={previewSide}
          aspectRatio={FACE_ASPECT}
          onClose={() => setPreviewSide(null)}
        />
      )}

      <div className="options-section">
        <div className="setting-row">
          <span className="setting-label">Качество и рамка (BG3)</span>
          <div className="rarity-grid">
            {OBJECT_THEME_OPTIONS.map((option) => {
              const pal = OBJECT_PALETTES[option.value];
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`theme-option ${object.theme === option.value ? 'active' : ''}`}
                  onClick={() => patch({ theme: option.value as ObjectTheme })}
                >
                  <span
                    className="theme-swatch"
                    style={{
                      background: `radial-gradient(circle at 35% 35%, ${pal.cardBgLight}, ${pal.cardBg})`,
                      borderColor: pal.accent,
                      boxShadow: `inset 0 0 0 1px ${pal.frame}`,
                    }}
                  />
                  <span className="theme-option-label">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="setting-row">
          <span className="setting-label">Заполнение иллюстрации</span>
          <div className="fill-mode-options">
            {IMAGE_FILL_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`fill-mode-option ${imageFillMode === option.value ? 'active' : ''}`}
                onClick={() => patch({ imageFillMode: option.value })}
              >
                {option.label}
              </button>
            ))}
          </div>
          {imageFillMode === 'cover' && (
            <p className="setting-hint">Перетащите рубашку в превью, чтобы сдвинуть кадр</p>
          )}
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
            Слоган (свиток на рубашке)
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
            rows={7}
            value={object.description}
            onChange={(event) => patch({ description: event.target.value })}
            placeholder="Эффект или история предмета. Короткий текст дополняется виньеткой, длинный автоматически уменьшает кегль"
          />
          {fitted.descriptionOverflow && (
            <p className="setting-overflow-warning" role="status">
              Текст превышает объём рамки — при печати конец описания будет обрезан.
            </p>
          )}
        </div>

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
      </div>

      <div className="options-section">
        <span className="setting-label">Характеристики предмета (BG3)</span>

        <div className="setting-row">
          <label className="setting-sublabel" htmlFor="object-stat">
            Показатель (урон / КД / бонус)
          </label>
          <input
            id="object-stat"
            type="text"
            className="setting-input"
            value={object.stat ?? ''}
            onChange={(event) => patch({ stat: event.target.value })}
            placeholder="Например, 1к8 + 1 или КД 16"
          />
        </div>

        <div className="object-stats-grid">
          <div className="setting-row">
            <label className="setting-sublabel" htmlFor="object-weight">
              Вес
            </label>
            <input
              id="object-weight"
              type="text"
              className="setting-input"
              value={object.weight ?? ''}
              onChange={(event) => patch({ weight: event.target.value })}
              placeholder="1.5 фн."
            />
          </div>

          <div className="setting-row">
            <label className="setting-sublabel" htmlFor="object-price">
              Цена
            </label>
            <input
              id="object-price"
              type="text"
              className="setting-input"
              value={object.price ?? ''}
              onChange={(event) => patch({ price: event.target.value })}
              placeholder="150 зм"
            />
          </div>
        </div>

        <div className="setting-row">
          <label className="setting-label setting-checkbox-row">
            <input
              type="checkbox"
              checked={Boolean(object.attunement)}
              onChange={(event) => patch({ attunement: event.target.checked })}
            />
            <span>Требует настройки</span>
          </label>
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

        <div className="options-actions-row">
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
        </div>

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

import type {
  CharacterCard,
  NameSettings,
  FontOption,
  BlockSizeOption,
  NameDisplaySide,
  ImageFillMode,
} from '../types';
import type { CardsPerPageOption } from '../constants';
import { getCardHeight, getHalfWidth } from '../constants';
import { PRESET_OVERLAYS } from '../utils/presetOverlays';
import { CardFace } from './CardFace';
import './CardOptionsMenu.css';

const FONT_OPTIONS: { value: FontOption; label: string }[] = [
  { value: 'medieval', label: 'Old Standard TT' },
  { value: 'elegant', label: 'Georgia' },
  { value: 'fantasy', label: 'Times New Roman' },
  { value: 'royal', label: 'Arial' },
  { value: 'script', label: 'Verdana' },
  { value: 'ancient', label: 'Trebuchet MS' },
  { value: 'inscription', label: 'Palatino' },
  { value: 'bold', label: 'Courier New' },
];

const BLOCK_SIZE_OPTIONS: { value: BlockSizeOption; label: string }[] = [
  { value: 'small', label: 'S' },
  { value: 'medium', label: 'M' },
  { value: 'large', label: 'L' },
];

const DISPLAY_SIDE_OPTIONS: { value: NameDisplaySide; label: string }[] = [
  { value: 'player', label: 'Игрок' },
  { value: 'gm', label: 'Мастер' },
  { value: 'both', label: 'Обе' },
];

const IMAGE_FILL_OPTIONS: { value: ImageFillMode; label: string }[] = [
  { value: 'cover', label: 'Заполнить (обрезка)' },
  { value: 'fitWidth', label: 'По ширине' },
  { value: 'fitHeight', label: 'По высоте' },
];

const FULL_PRESETS = Object.values(PRESET_OVERLAYS).filter((preset) => preset.kind === 'full');
const LOWER_PRESETS = Object.values(PRESET_OVERLAYS).filter((preset) => preset.kind === 'lower');

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
  canMoveUp: boolean;
  canMoveDown: boolean;
}

function SidePreview({
  card,
  side,
  label,
  aspectRatio,
}: {
  card: CharacterCard;
  side: 'player' | 'gm';
  label: string;
  aspectRatio: string;
}) {
  return (
    <div className="preview-side">
      <span className="side-label">{label}</span>
      <div className="side-image-container" style={{ aspectRatio }}>
        <CardFace card={card} side={side} imageClassName="side-image" />
      </div>
    </div>
  );
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
  canMoveUp,
  canMoveDown,
}: CardOptionsMenuProps) {
  const { nameSettings, imageFillMode = 'cover' } = card;
  const hangingAspect = `${getCardHeight(cardsPerPage)} / ${getHalfWidth(cardsPerPage)}`;

  const handleRemove = () => {
    onRemove(card.id);
    onClose();
  };

  const updateNameSetting = <K extends keyof NameSettings>(key: K, value: NameSettings[K]) => {
    onUpdateNameSettings(card.id, { ...nameSettings, [key]: value });
  };

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

      <div className="options-preview">
        <div className="preview-sides">
          <SidePreview
            card={card}
            side="player"
            label="Сторона игрока"
            aspectRatio={hangingAspect}
          />
          <SidePreview
            card={card}
            side="gm"
            label="Сторона мастера"
            aspectRatio={hangingAspect}
          />
        </div>
      </div>

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
        </div>
      </div>

      <div className="options-section">
        <label className="section-toggle">
          <input
            type="checkbox"
            checked={nameSettings.enabled}
            onChange={(e) => updateNameSetting('enabled', e.target.checked)}
          />
          <span className="toggle-label">Имя персонажа</span>
        </label>

        {nameSettings.enabled && (
          <div className="name-settings">
            <div className="setting-row">
              <label className="setting-label" htmlFor="character-name">
                Имя
              </label>
              <input
                id="character-name"
                type="text"
                className={`setting-input font-${nameSettings.font}`}
                value={nameSettings.name}
                onChange={(e) => updateNameSetting('name', e.target.value)}
                placeholder="Введите имя персонажа..."
              />
            </div>

            <div className="setting-row">
              <span className="setting-label">Шрифт</span>
              <div className="font-options">
                {FONT_OPTIONS.map((font) => (
                  <button
                    key={font.value}
                    type="button"
                    className={`font-option font-${font.value} ${nameSettings.font === font.value ? 'active' : ''}`}
                    onClick={() => updateNameSetting('font', font.value)}
                  >
                    {font.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-row">
              <span className="setting-label">Размер блока</span>
              <div className="block-size-options">
                {BLOCK_SIZE_OPTIONS.map((size) => (
                  <button
                    key={size.value}
                    type="button"
                    className={`size-option ${nameSettings.blockSize === size.value ? 'active' : ''}`}
                    onClick={() => updateNameSetting('blockSize', size.value)}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-row">
              <span className="setting-label">Фон</span>
              <div className="background-options">
                <div className="bg-group">
                  <span className="bg-group-label">Полноразмерные рамки</span>
                  <div className="bg-buttons">
                    {FULL_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        className={`bg-option bg-option-preset ${nameSettings.background === preset.id ? 'active' : ''}`}
                        onClick={() => updateNameSetting('background', preset.id)}
                        title={preset.label}
                        style={{ backgroundImage: `url("${preset.src}")` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="bg-group">
                  <span className="bg-group-label">Нижние плашки</span>
                  <div className="bg-buttons">
                    {LOWER_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        className={`bg-option bg-option-preset ${nameSettings.background === preset.id ? 'active' : ''}`}
                        onClick={() => updateNameSetting('background', preset.id)}
                        title={preset.label}
                        style={{ backgroundImage: `url("${preset.src}")` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="setting-row">
              <span className="setting-label">Показывать на</span>
              <div className="display-side-options">
                {DISPLAY_SIDE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`side-option ${nameSettings.displaySide === option.value ? 'active' : ''}`}
                    onClick={() => updateNameSetting('displaySide', option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="options-actions">
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
    </div>
  );
}

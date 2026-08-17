import type { CharacterCard, NameSettings, FontOption, BlockSizeOption, NameBackgroundType, NameDisplaySide, ImageFillMode } from '../types';
import { FilledCharacterImage } from './FilledCharacterImage';

const FONT_OPTIONS: { value: FontOption; label: string }[] = [
  { value: 'medieval', label: 'Средневековый' },
  { value: 'elegant', label: 'Элегантный' },
  { value: 'fantasy', label: 'Фэнтези' },
];

const BLOCK_SIZE_OPTIONS: { value: BlockSizeOption; label: string }[] = [
  { value: 'small', label: 'S' },
  { value: 'medium', label: 'M' },
  { value: 'large', label: 'L' },
];

const BACKGROUND_OPTIONS: { value: NameBackgroundType; label: string; type: 'gradient' | 'preset' }[] = [
  { value: 'gradient-dark', label: 'Тёмный', type: 'gradient' },
  { value: 'gradient-gold', label: 'Золотой', type: 'gradient' },
  { value: 'gradient-red', label: 'Красный', type: 'gradient' },
  { value: 'scroll', label: 'Свиток', type: 'preset' },
  { value: 'banner', label: 'Знамя', type: 'preset' },
  { value: 'shield', label: 'Щит', type: 'preset' },
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

interface CardOptionsMenuProps {
  card: CharacterCard;
  onClose: () => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onPlayerSideClick: (id: string) => void;
  onGmSideClick: (id: string) => void;
  onUpdateNameSettings: (id: string, settings: NameSettings) => void;
  onUpdateImageFillMode: (id: string, mode: ImageFillMode) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

/**
 * Options menu panel that appears when a card is selected
 */
export function CardOptionsMenu({
  card,
  onClose,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onPlayerSideClick,
  onGmSideClick,
  onUpdateNameSettings,
  onUpdateImageFillMode,
  canMoveUp,
  canMoveDown,
}: CardOptionsMenuProps) {
  const { nameSettings, imageFillMode = 'cover' } = card;

  const handleRemove = () => {
    URL.revokeObjectURL(card.imageUrl);
    onRemove(card.id);
    onClose();
  };

  const handleDuplicate = () => {
    onDuplicate(card.id);
  };

  const updateNameSetting = <K extends keyof NameSettings>(key: K, value: NameSettings[K]) => {
    onUpdateNameSettings(card.id, { ...nameSettings, [key]: value });
  };

  const showNameOnSide = (side: 'player' | 'gm') => {
    return nameSettings.enabled && 
           nameSettings.name.trim() !== '' && 
           (nameSettings.displaySide === side || nameSettings.displaySide === 'both');
  };

  return (
    <div className="card-options-menu">
      <div className="options-header">
        <h3 className="options-title">Параметры карточки</h3>
        <button
          className="options-close"
          onClick={onClose}
          aria-label="Закрыть меню"
        >
          ×
        </button>
      </div>

      <div className="options-preview">
        <div className="preview-sides">
          <button
            className="preview-side"
            onClick={() => onPlayerSideClick(card.id)}
            aria-label="Редактировать сторону игрока"
          >
            <span className="side-label">Сторона игрока</span>
            <div className="side-image-container">
              <FilledCharacterImage
                src={card.imageUrl}
                alt="Сторона игрока"
                imageFillMode={imageFillMode}
                className="side-image"
              />
              {showNameOnSide('player') && (
                <div className={`name-overlay name-bg-${nameSettings.background} name-font-${nameSettings.font} name-block-${nameSettings.blockSize}`}>
                  <span className="name-text">{nameSettings.name}</span>
                </div>
              )}
            </div>
          </button>

          <button
            className="preview-side"
            onClick={() => onGmSideClick(card.id)}
            aria-label="Редактировать сторону мастера"
          >
            <span className="side-label">Сторона мастера</span>
            <div className="side-image-container">
              <FilledCharacterImage
                src={card.imageUrl}
                alt="Сторона мастера"
                imageFillMode={imageFillMode}
                className="side-image"
              />
              {showNameOnSide('gm') && (
                <div className={`name-overlay name-bg-${nameSettings.background} name-font-${nameSettings.font} name-block-${nameSettings.blockSize}`}>
                  <span className="name-text">{nameSettings.name}</span>
                </div>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Image fill mode */}
      <div className="options-section">
        <div className="setting-row">
          <label className="setting-label">Заполнение</label>
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

      {/* Character Name Settings */}
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
              <label className="setting-label">Имя</label>
              <input
                type="text"
                className={`setting-input font-${nameSettings.font}`}
                value={nameSettings.name}
                onChange={(e) => updateNameSetting('name', e.target.value)}
                placeholder="Введите имя персонажа..."
              />
            </div>

            <div className="setting-row">
              <label className="setting-label">Шрифт</label>
              <div className="font-options">
                {FONT_OPTIONS.map((font) => (
                  <button
                    key={font.value}
                    className={`font-option font-${font.value} ${nameSettings.font === font.value ? 'active' : ''}`}
                    onClick={() => updateNameSetting('font', font.value)}
                  >
                    {font.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-row">
              <label className="setting-label">Размер блока</label>
              <div className="block-size-options">
                {BLOCK_SIZE_OPTIONS.map((size) => (
                  <button
                    key={size.value}
                    className={`size-option ${nameSettings.blockSize === size.value ? 'active' : ''}`}
                    onClick={() => updateNameSetting('blockSize', size.value)}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-row">
              <label className="setting-label">Фон</label>
              <div className="background-options">
                <div className="bg-group">
                  <span className="bg-group-label">Градиенты</span>
                  <div className="bg-buttons">
                    {BACKGROUND_OPTIONS.filter(bg => bg.type === 'gradient').map((bg) => (
                      <button
                        key={bg.value}
                        className={`bg-option bg-preview-${bg.value} ${nameSettings.background === bg.value ? 'active' : ''}`}
                        onClick={() => updateNameSetting('background', bg.value)}
                        title={bg.label}
                      />
                    ))}
                  </div>
                </div>
                <div className="bg-group">
                  <span className="bg-group-label">Пресеты</span>
                  <div className="bg-buttons">
                    {BACKGROUND_OPTIONS.filter(bg => bg.type === 'preset').map((bg) => (
                      <button
                        key={bg.value}
                        className={`bg-option bg-preview-${bg.value} ${nameSettings.background === bg.value ? 'active' : ''}`}
                        onClick={() => updateNameSetting('background', bg.value)}
                        title={bg.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="setting-row">
              <label className="setting-label">Показывать на</label>
              <div className="display-side-options">
                {DISPLAY_SIDE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
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
          className="option-btn"
          onClick={() => onMoveDown(card.id)}
          disabled={!canMoveDown}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6,9 12,15 18,9" />
          </svg>
          Ниже
        </button>

        <button className="option-btn" onClick={handleDuplicate}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Дублировать
        </button>

        <button className="option-btn option-btn-danger" onClick={handleRemove}>
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

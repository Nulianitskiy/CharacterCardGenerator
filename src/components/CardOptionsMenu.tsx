import type { CharacterCard, NameSettings, FontOption, BlockSizeOption, NameBackgroundType, NameDisplaySide } from '../types';

const FONT_OPTIONS: { value: FontOption; label: string }[] = [
  { value: 'medieval', label: 'Medieval' },
  { value: 'elegant', label: 'Elegant' },
  { value: 'bold', label: 'Bold' },
  { value: 'fantasy', label: 'Fantasy' },
];

const BLOCK_SIZE_OPTIONS: { value: BlockSizeOption; label: string }[] = [
  { value: 'small', label: 'S' },
  { value: 'medium', label: 'M' },
  { value: 'large', label: 'L' },
];

const BACKGROUND_OPTIONS: { value: NameBackgroundType; label: string; type: 'gradient' | 'preset' }[] = [
  { value: 'gradient-dark', label: 'Dark', type: 'gradient' },
  { value: 'gradient-gold', label: 'Gold', type: 'gradient' },
  { value: 'gradient-red', label: 'Red', type: 'gradient' },
  { value: 'scroll', label: 'Scroll', type: 'preset' },
  { value: 'banner', label: 'Banner', type: 'preset' },
  { value: 'shield', label: 'Shield', type: 'preset' },
];

const DISPLAY_SIDE_OPTIONS: { value: NameDisplaySide; label: string }[] = [
  { value: 'player', label: 'Player' },
  { value: 'gm', label: 'GM' },
  { value: 'both', label: 'Both' },
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
  canMoveUp,
  canMoveDown,
}: CardOptionsMenuProps) {
  const { nameSettings } = card;

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
        <h3 className="options-title">Card Options</h3>
        <button
          className="options-close"
          onClick={onClose}
          aria-label="Close menu"
        >
          ×
        </button>
      </div>

      <div className="options-preview">
        <div className="preview-sides">
          <button
            className="preview-side"
            onClick={() => onPlayerSideClick(card.id)}
            aria-label="Edit player side"
          >
            <span className="side-label">Player Side</span>
            <div className="side-image-container">
              <img
                src={card.imageUrl}
                alt="Player side"
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
            aria-label="Edit GM side"
          >
            <span className="side-label">GM Side</span>
            <div className="side-image-container">
              <img
                src={card.imageUrl}
                alt="GM side"
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

      {/* Character Name Settings */}
      <div className="options-section">
        <label className="section-toggle">
          <input
            type="checkbox"
            checked={nameSettings.enabled}
            onChange={(e) => updateNameSetting('enabled', e.target.checked)}
          />
          <span className="toggle-label">Character Name</span>
        </label>

        {nameSettings.enabled && (
          <div className="name-settings">
            <div className="setting-row">
              <label className="setting-label">Name</label>
              <input
                type="text"
                className="setting-input"
                value={nameSettings.name}
                onChange={(e) => updateNameSetting('name', e.target.value)}
                placeholder="Enter character name..."
              />
            </div>

            <div className="setting-row">
              <label className="setting-label">Font</label>
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
              <label className="setting-label">Block Size</label>
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
              <label className="setting-label">Background</label>
              <div className="background-options">
                <div className="bg-group">
                  <span className="bg-group-label">Gradients</span>
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
                  <span className="bg-group-label">Presets</span>
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
              <label className="setting-label">Display On</label>
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
          Move Up
        </button>

        <button
          className="option-btn"
          onClick={() => onMoveDown(card.id)}
          disabled={!canMoveDown}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6,9 12,15 18,9" />
          </svg>
          Move Down
        </button>

        <button className="option-btn" onClick={handleDuplicate}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Duplicate
        </button>

        <button className="option-btn option-btn-danger" onClick={handleRemove}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3,6 5,6 21,6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
          Remove
        </button>
      </div>
    </div>
  );
}

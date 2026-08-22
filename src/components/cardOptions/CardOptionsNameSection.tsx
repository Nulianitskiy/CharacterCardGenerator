import type { CharacterCard, NameSettings } from '../../types';
import { BLOCK_SIZE_OPTIONS, DISPLAY_SIDE_OPTIONS, FONT_OPTIONS, FULL_PRESETS, LOWER_PRESETS } from './optionLists';

interface CardOptionsNameSectionProps {
  card: CharacterCard;
  onUpdateNameSettings: (id: string, settings: NameSettings) => void;
}

export function CardOptionsNameSection({ card, onUpdateNameSettings }: CardOptionsNameSectionProps) {
  const { nameSettings } = card;

  const updateNameSetting = <K extends keyof NameSettings>(key: K, value: NameSettings[K]) => {
    onUpdateNameSettings(card.id, { ...nameSettings, [key]: value });
  };

  return (
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
  );
}

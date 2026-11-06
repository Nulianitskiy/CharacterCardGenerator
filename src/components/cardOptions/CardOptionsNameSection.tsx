import { useState } from 'react';
import {
  MAX_NAME_FONT_SIZE_PERCENT,
  MIN_NAME_FONT_SIZE_PERCENT,
  type CharacterCard,
  type NameSettings,
} from '../../types';
import { clampNameFontSizePercent } from '../../utils/nameLabelRender';
import { getNameCssOverride, isLocalNameFont } from '../../utils/nameFont';
import { getPresetOverlay } from '../../utils/presetOverlays';
import { DISPLAY_SIDE_OPTIONS, FULL_PRESETS, LOWER_PRESETS } from './optionLists';
import { FontPicker } from './FontPicker';

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
              className={`setting-input ${isLocalNameFont(nameSettings.font) ? '' : `font-${nameSettings.font}`}`}
              style={getNameCssOverride(nameSettings.font)}
              value={nameSettings.name}
              onChange={(e) => updateNameSetting('name', e.target.value)}
              placeholder="Введите имя персонажа..."
            />
          </div>

          <div className="setting-row">
            <span className="setting-label">Шрифт</span>
            <FontPicker
              value={nameSettings.font}
              onChange={(font) => updateNameSetting('font', font)}
            />
          </div>

          <div className="setting-row">
            <label className="setting-label" htmlFor="name-font-size">
              Размер шрифта
            </label>
            <FontSizeControl
              value={nameSettings.fontSizePercent}
              onCommit={(percent) => updateNameSetting('fontSizePercent', percent)}
            />
            <p className="setting-hint">
              Процент от максимального размера плашки; длинное имя автоматически уменьшится, чтобы
              поместиться.
            </p>
          </div>

          <div className="setting-row">
            <span className="setting-label">
              Фон{getPresetOverlay(nameSettings.background) ? ` — ${getPresetOverlay(nameSettings.background)?.label}` : ''}
            </span>
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

interface FontSizeControlProps {
  value: number;
  onCommit: (percent: number) => void;
}

const FONT_SIZE_STEP = 5;

export function FontSizeControl({ value, onCommit }: FontSizeControlProps) {
  const [draft, setDraft] = useState(() => String(value));
  // When the committed value changes from outside (stepper normalization,
  // switching cards in the modal), refresh the draft; React's render-time
  // state adjustment instead of an effect.
  const [lastCommitted, setLastCommitted] = useState(value);
  if (lastCommitted !== value) {
    setLastCommitted(value);
    setDraft(String(value));
  }

  const commitClamped = (percent: number) => {
    const clamped = clampNameFontSizePercent(percent);
    setLastCommitted(clamped);
    setDraft(String(clamped));
    onCommit(clamped);
  };

  const step = (direction: -1 | 1) => {
    commitClamped(clampNameFontSizePercent(value) + direction * FONT_SIZE_STEP);
  };

  return (
    <div className="font-size-control">
      <button
        type="button"
        className="size-option"
        onClick={() => step(-1)}
        aria-label="Уменьшить размер шрифта"
      >
        −
      </button>
      <input
        id="name-font-size"
        type="number"
        className="setting-input setting-input-narrow"
        min={MIN_NAME_FONT_SIZE_PERCENT}
        max={MAX_NAME_FONT_SIZE_PERCENT}
        step={1}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          const parsed = Number.parseInt(e.target.value, 10);
          if (Number.isFinite(parsed)) {
            setLastCommitted(parsed);
            onCommit(parsed);
          }
        }}
        onBlur={() => {
          const parsed = Number.parseInt(draft, 10);
          commitClamped(Number.isFinite(parsed) ? parsed : value);
        }}
      />
      <span className="font-size-unit">%</span>
      <button
        type="button"
        className="size-option"
        onClick={() => step(1)}
        aria-label="Увеличить размер шрифта"
      >
        +
      </button>
    </div>
  );
}

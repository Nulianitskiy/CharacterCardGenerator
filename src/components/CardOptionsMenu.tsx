import { useCallback, useState } from 'react';
import {
  CARD_SIDE_LABELS,
  type CharacterCard,
  type NameSettings,
  type FontOption,
  type BlockSizeOption,
  type NameDisplaySide,
  type ImageFillMode,
  type DndStatsSettings,
  type CardSide,
  type AbilityKey,
} from '../types';
import { getHangingPortraitAspect, type CardsPerPageOption } from '../constants';
import { PRESET_OVERLAYS } from '../utils/presetOverlays';
import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  ABILITY_NAMES,
  abilityModifier,
  clampAc,
  clampHp,
  clampInitiative,
  clampPassive,
  clampSpellSaveDc,
  cloneDndStats,
  formatSigned,
  withUpdatedAbility,
} from '../utils/dndStats';
import { CardFace } from './CardFace';
import { SidePreviewModal } from './SidePreviewModal';
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
  { value: 'a', label: CARD_SIDE_LABELS.a },
  { value: 'b', label: CARD_SIDE_LABELS.b },
  { value: 'both', label: 'Обе' },
];

const STATS_SIDE_OPTIONS: { value: CardSide; label: string }[] = [
  { value: 'a', label: CARD_SIDE_LABELS.a },
  { value: 'b', label: CARD_SIDE_LABELS.b },
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
  onUpdateDndStats: (id: string, stats: DndStatsSettings) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

function SidePreview({
  card,
  side,
  label,
  aspectRatio,
  onOpen,
}: {
  card: CharacterCard;
  side: CardSide;
  label: string;
  aspectRatio: number;
  onOpen: (side: CardSide) => void;
}) {
  return (
    <button
      type="button"
      className="preview-side"
      onClick={() => onOpen(side)}
      title="Открыть в полном размере"
    >
      <span className="side-label">{label}</span>
      <div className="side-image-container" style={{ aspectRatio }}>
        <CardFace card={card} side={side} imageClassName="side-image" />
      </div>
    </button>
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
  onUpdateDndStats,
  canMoveUp,
  canMoveDown,
}: CardOptionsMenuProps) {
  const { nameSettings, imageFillMode = 'cover' } = card;
  const dndStats = cloneDndStats(card.dndStats);
  const hangingAspect = getHangingPortraitAspect(cardsPerPage);
  const [previewSide, setPreviewSide] = useState<CardSide | null>(null);
  const closePreview = useCallback(() => setPreviewSide(null), []);

  const handleRemove = () => {
    onRemove(card.id);
    onClose();
  };

  const updateNameSetting = <K extends keyof NameSettings>(key: K, value: NameSettings[K]) => {
    onUpdateNameSettings(card.id, { ...nameSettings, [key]: value });
  };

  const updateDndStats = (next: DndStatsSettings) => {
    onUpdateDndStats(card.id, next);
  };

  const handleAbilityChange = (key: AbilityKey, raw: string) => {
    if (raw.trim() === '') {
      updateDndStats(withUpdatedAbility(dndStats, key, null));
      return;
    }
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) return;
    updateDndStats(withUpdatedAbility(dndStats, key, parsed));
  };

  const handleOptionalNumber = (
    raw: string,
    field: 'ac' | 'hpMax' | 'initiative' | 'spellSaveDc' | 'passivePerception',
    clamp: (n: number) => number,
    allowMinus = false
  ) => {
    if (raw.trim() === '') {
      updateDndStats({ ...dndStats, [field]: null });
      return;
    }
    if (allowMinus && raw.trim() === '-') return;
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) return;
    updateDndStats({ ...dndStats, [field]: clamp(parsed) });
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
            side="a"
            label={CARD_SIDE_LABELS.a}
            aspectRatio={hangingAspect}
            onOpen={setPreviewSide}
          />
          <SidePreview
            card={card}
            side="b"
            label={CARD_SIDE_LABELS.b}
            aspectRatio={hangingAspect}
            onOpen={setPreviewSide}
          />
        </div>
      </div>

      {previewSide && (
        <SidePreviewModal
          card={card}
          side={previewSide}
          aspectRatio={hangingAspect}
          onClose={closePreview}
        />
      )}

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

      <div className="options-section">
        <label className="section-toggle">
          <input
            type="checkbox"
            checked={dndStats.enabled}
            onChange={(e) => updateDndStats({ ...dndStats, enabled: e.target.checked })}
          />
          <span className="toggle-label">{'Карточка D&D'}</span>
        </label>

        {dndStats.enabled && (
          <div className="name-settings">
            <p className="setting-hint">
              Портрет на выбранной стороне заменится листом персонажа. Пустые поля можно заполнить
              от руки после печати.
            </p>

            {!nameSettings.enabled && (
              <div className="setting-row">
                <label className="setting-label" htmlFor="dnd-character-name">
                  Имя
                </label>
                <input
                  id="dnd-character-name"
                  type="text"
                  className={`setting-input font-${nameSettings.font}`}
                  value={nameSettings.name}
                  onChange={(e) => updateNameSetting('name', e.target.value)}
                  placeholder="Оставьте пустым, чтобы вписать от руки"
                />
              </div>
            )}

            <div className="setting-row">
              <label className="setting-label" htmlFor="dnd-class-level">
                Класс и уровень
              </label>
              <input
                id="dnd-class-level"
                type="text"
                className="setting-input"
                value={dndStats.classLevel}
                onChange={(e) => updateDndStats({ ...dndStats, classLevel: e.target.value })}
                placeholder="Например, паладин 3"
              />
            </div>

            <div className="setting-row">
              <label className="setting-label" htmlFor="dnd-race">
                Раса
              </label>
              <input
                id="dnd-race"
                type="text"
                className="setting-input"
                value={dndStats.race}
                onChange={(e) => updateDndStats({ ...dndStats, race: e.target.value })}
                placeholder="Например, леонин"
              />
            </div>

            <div className="setting-row">
              <span className="setting-label">Показывать на</span>
              <div className="display-side-options">
                {STATS_SIDE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`side-option ${dndStats.displaySide === option.value ? 'active' : ''}`}
                    onClick={() => updateDndStats({ ...dndStats, displaySide: option.value })}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-row">
              <span className="setting-label">Боевые показатели</span>
              <div className="stat-grid">
                <label className="stat-cell">
                  <span className="stat-cell-label">КД</span>
                  <input
                    type="number"
                    min={0}
                    max={40}
                    aria-label="Класс доспеха"
                    className="stat-cell-input"
                    value={dndStats.ac ?? ''}
                    onChange={(e) => handleOptionalNumber(e.target.value, 'ac', clampAc)}
                  />
                </label>
                <label className="stat-cell">
                  <span className="stat-cell-label">Иниц.</span>
                  <input
                    type="number"
                    min={-20}
                    max={20}
                    aria-label="Инициатива"
                    className="stat-cell-input"
                    value={dndStats.initiative ?? ''}
                    onChange={(e) =>
                      handleOptionalNumber(e.target.value, 'initiative', clampInitiative, true)
                    }
                  />
                </label>
                <label className="stat-cell">
                  <span className="stat-cell-label">ХП</span>
                  <input
                    type="number"
                    min={0}
                    max={999}
                    aria-label="Максимум ХП"
                    className="stat-cell-input"
                    value={dndStats.hpMax ?? ''}
                    onChange={(e) => handleOptionalNumber(e.target.value, 'hpMax', clampHp)}
                  />
                </label>
              </div>
            </div>

            <div className="setting-row">
              <label className="setting-label" htmlFor="dnd-speed">
                Скорость
              </label>
              <input
                id="dnd-speed"
                type="text"
                className="setting-input"
                value={dndStats.speed}
                onChange={(e) => updateDndStats({ ...dndStats, speed: e.target.value })}
                placeholder="Например, 30 фт."
              />
            </div>

            <div className="setting-row">
              <label className="setting-label" htmlFor="dnd-spell-dc">
                Сложность спасбросков заклинаний
              </label>
              <input
                id="dnd-spell-dc"
                type="number"
                min={0}
                max={40}
                className="setting-input setting-input-narrow"
                value={dndStats.spellSaveDc ?? ''}
                onChange={(e) =>
                  handleOptionalNumber(e.target.value, 'spellSaveDc', clampSpellSaveDc)
                }
              />
            </div>

            <div className="setting-row">
              <label className="setting-label" htmlFor="dnd-passive">
                Пассивное восприятие
              </label>
              <input
                id="dnd-passive"
                type="number"
                min={0}
                max={40}
                className="setting-input setting-input-narrow"
                value={dndStats.passivePerception ?? ''}
                onChange={(e) =>
                  handleOptionalNumber(e.target.value, 'passivePerception', clampPassive)
                }
              />
            </div>

            <div className="setting-row">
              <span className="setting-label">Характеристики</span>
              <div className="stat-grid">
                {ABILITY_KEYS.map((key) => {
                  const score = dndStats.abilities[key];
                  return (
                    <label key={key} className="stat-cell">
                      <span className="stat-cell-label" title={ABILITY_NAMES[key]}>
                        {ABILITY_LABELS[key]}
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        aria-label={ABILITY_NAMES[key]}
                        className="stat-cell-input"
                        value={score ?? ''}
                        onChange={(e) => handleAbilityChange(key, e.target.value)}
                      />
                      <span className="stat-cell-mod">
                        {score == null ? '\u00a0' : formatSigned(abilityModifier(score))}
                      </span>
                    </label>
                  );
                })}
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

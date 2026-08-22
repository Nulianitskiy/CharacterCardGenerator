import type { AbilityKey, CharacterCard, DndStatsSettings, NameSettings } from '../../types';
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
} from '../../utils/dndStats';
import { STATS_SIDE_OPTIONS } from './optionLists';

interface CardOptionsDndSectionProps {
  card: CharacterCard;
  onUpdateNameSettings: (id: string, settings: NameSettings) => void;
  onUpdateDndStats: (id: string, stats: DndStatsSettings) => void;
}

export function CardOptionsDndSection({
  card,
  onUpdateNameSettings,
  onUpdateDndStats,
}: CardOptionsDndSectionProps) {
  const { nameSettings } = card;
  const dndStats = cloneDndStats(card.dndStats);

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
                onChange={(e) =>
                  onUpdateNameSettings(card.id, { ...nameSettings, name: e.target.value })
                }
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
  );
}

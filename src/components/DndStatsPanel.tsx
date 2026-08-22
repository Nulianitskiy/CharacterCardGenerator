import type { FontOption, DndStatsSettings } from '../types';
import {
  ABILITY_KEYS,
  ABILITY_SHEET_LABELS,
  abilityModifier,
  formatStat,
  getCombatStatValue,
} from '../utils/dndStats';
import { COMPACT_COMBAT_STATS, ICON_COMBAT_STATS, STAT_ICON_PATHS } from '../utils/statIcons';
import './DndStatsPanel.css';

interface DndStatsPanelProps {
  stats: DndStatsSettings;
  name: string;
  font: FontOption;
}

function CombatIconStat({
  stats,
  id,
  label,
  fullName,
  icon,
}: (typeof ICON_COMBAT_STATS)[number] & { stats: DndStatsSettings }) {
  return (
    <div className="sheet-icon-stat" title={fullName} aria-label={`${fullName} ${getCombatStatValue(stats, id)}`}>
      <div className="sheet-icon-stat-inner">
        <svg className="sheet-icon-svg" viewBox="0 0 100 100" aria-hidden="true">
          <path className="sheet-icon-shape" d={STAT_ICON_PATHS[icon]} />
        </svg>
        <div className="sheet-icon-overlay">
          <span className="sheet-icon-value">{getCombatStatValue(stats, id)}</span>
          <span className="sheet-icon-label">{label}</span>
        </div>
      </div>
    </div>
  );
}

export function DndStatsPanel({ stats, name, font }: DndStatsPanelProps) {
  const trimmedName = name.trim();
  const classLevel = stats.classLevel.trim();
  const race = stats.race.trim();

  return (
    <div className="dnd-stats-panel">
      <header className="sheet-header">
        <div className="sheet-name-box">
          <span className="sheet-field-label">Имя персонажа</span>
          <span className={`sheet-name-value name-font-${font}`}>
            <span className="name-text">{trimmedName}</span>
          </span>
        </div>
        <div className="sheet-meta">
          <div className="sheet-meta-field">
            <span className="sheet-meta-value">{classLevel}</span>
            <span className="sheet-field-label">Класс и уровень</span>
          </div>
          <div className="sheet-meta-field">
            <span className="sheet-meta-value">{race}</span>
            <span className="sheet-field-label">Раса</span>
          </div>
        </div>
      </header>

      <div className="sheet-body">
        <div className="sheet-abilities">
          {ABILITY_KEYS.map((key) => {
            const score = stats.abilities[key];
            return (
              <div key={key} className="sheet-ability">
                <span className="sheet-ability-name">{ABILITY_SHEET_LABELS[key]}</span>
                <span className="sheet-ability-score">{formatStat(score)}</span>
                <span className="sheet-ability-mod">
                  {score == null ? '' : formatStat(abilityModifier(score), true)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="sheet-right">
          <div className="sheet-compact-stats">
            {COMPACT_COMBAT_STATS.map((stat) => (
              <div key={stat.id} className="sheet-meta-field" title={stat.fullName}>
                <span className="sheet-meta-value">{getCombatStatValue(stats, stat.id)}</span>
                <span className="sheet-field-label">{stat.label}</span>
              </div>
            ))}
          </div>
          <div className="sheet-icon-row">
            {ICON_COMBAT_STATS.map((stat) => (
              <CombatIconStat key={stat.id} stats={stats} {...stat} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

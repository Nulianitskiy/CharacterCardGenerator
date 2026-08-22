import type { AbilityKey, AbilityScores, DndStatsSettings } from '../types';

export const ABILITY_KEYS: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: 'СИЛ',
  dex: 'ЛОВ',
  con: 'ТЕЛ',
  int: 'ИНТ',
  wis: 'МДР',
  cha: 'ХАР',
};

export const ABILITY_SHEET_LABELS: Record<AbilityKey, string> = {
  str: 'СИЛА',
  dex: 'ЛОВКОСТЬ',
  con: 'ТЕЛОСЛ.',
  int: 'ИНТЕЛЛЕКТ',
  wis: 'МУДРОСТЬ',
  cha: 'ХАРИЗМА',
};

export const ABILITY_NAMES: Record<AbilityKey, string> = {
  str: 'Сила',
  dex: 'Ловкость',
  con: 'Телосложение',
  int: 'Интеллект',
  wis: 'Мудрость',
  cha: 'Харизма',
};

export const emptyAbilityScores = (): AbilityScores => ({
  str: null,
  dex: null,
  con: null,
  int: null,
  wis: null,
  cha: null,
});

export const abilityModifier = (score: number): number => Math.floor((score - 10) / 2);

export const formatSigned = (n: number): string => (n >= 0 ? `+${n}` : String(n));

export const formatStat = (value: number | null, signed = false): string => {
  if (value == null) return '';
  return signed ? formatSigned(value) : String(value);
};

export const createDefaultDndStats = (): DndStatsSettings => ({
  enabled: false,
  displaySide: 'b',
  ac: null,
  abilities: emptyAbilityScores(),
  classLevel: '',
  race: '',
  spellSaveDc: null,
  speed: '',
  hpMax: null,
  initiative: null,
  passivePerception: null,
});

export const cloneDndStats = (stats?: DndStatsSettings): DndStatsSettings => {
  const src = stats ?? createDefaultDndStats();
  return {
    enabled: src.enabled,
    displaySide: src.displaySide,
    ac: src.ac ?? null,
    abilities: { ...emptyAbilityScores(), ...src.abilities },
    classLevel: src.classLevel ?? '',
    race: src.race ?? '',
    spellSaveDc: src.spellSaveDc ?? null,
    speed: src.speed ?? '',
    hpMax: src.hpMax ?? null,
    initiative: src.initiative ?? null,
    passivePerception: src.passivePerception ?? null,
  };
};

const clampRange = (n: number, min: number, max: number, fallback: number): number => {
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
};

export const clampAbilityScore = (n: number): number => clampRange(n, 1, 30, 10);

export const clampAc = (n: number): number => clampRange(n, 0, 40, 10);

export const clampHp = (n: number): number => clampRange(n, 0, 999, 0);

export const clampInitiative = (n: number): number => clampRange(n, -20, 20, 0);

export const clampSpellSaveDc = (n: number): number => clampRange(n, 0, 40, 10);

export const clampPassive = (n: number): number => clampRange(n, 0, 40, 10);

export const withUpdatedAbility = (
  stats: DndStatsSettings,
  key: AbilityKey,
  score: number | null
): DndStatsSettings => ({
  ...stats,
  abilities: {
    ...stats.abilities,
    [key]: score == null ? null : clampAbilityScore(score),
  },
});

export const getCombatStatValue = (
  stats: DndStatsSettings,
  id: 'ac' | 'initiative' | 'speed' | 'hpMax' | 'spellSaveDc' | 'passivePerception'
): string => {
  switch (id) {
    case 'ac':
      return formatStat(stats.ac);
    case 'initiative':
      return formatStat(stats.initiative, true);
    case 'speed':
      return stats.speed.trim();
    case 'hpMax':
      return formatStat(stats.hpMax);
    case 'spellSaveDc':
      return formatStat(stats.spellSaveDc);
    case 'passivePerception':
      return formatStat(stats.passivePerception);
  }
};

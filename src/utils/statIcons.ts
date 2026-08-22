export type CombatStatId =
  | 'ac'
  | 'initiative'
  | 'speed'
  | 'hpMax'
  | 'spellSaveDc'
  | 'passivePerception';

export type StatIconKind = 'shield' | 'heart';

export interface CombatFieldMeta {
  id: CombatStatId;
  label: string;
  fullName: string;
}

export const COMPACT_COMBAT_STATS: CombatFieldMeta[] = [
  { id: 'initiative', label: 'Инициатива', fullName: 'Инициатива' },
  { id: 'speed', label: 'Скорость', fullName: 'Скорость' },
  { id: 'spellSaveDc', label: 'Сл. заклинаний', fullName: 'Сложность спасбросков заклинаний' },
  { id: 'passivePerception', label: 'Пасс. восприятие', fullName: 'Пассивное восприятие' },
];

export const ICON_COMBAT_STATS: Array<CombatFieldMeta & { icon: StatIconKind }> = [
  { id: 'ac', label: 'КД', fullName: 'Класс доспеха', icon: 'shield' },
  { id: 'hpMax', label: 'ХП', fullName: 'Максимум ХП', icon: 'heart' },
];

/** Icon outlines in a 100×100 viewBox */
export const STAT_ICON_PATHS: Record<StatIconKind, string> = {
  shield: 'M50 6 L86 20 V50 C86 74 70 88 50 94 C30 88 14 74 14 50 V20 Z',
  heart:
    'M50 88 C20 66 10 50 10 34 C10 21 20 12 33 12 C41 12 47 16 50 24 C53 16 59 12 67 12 C80 12 90 21 90 34 C90 50 80 66 50 88 Z',
};

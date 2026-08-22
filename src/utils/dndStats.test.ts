import { describe, expect, it } from 'vitest';
import {
  abilityModifier,
  clampAbilityScore,
  clampAc,
  cloneDndStats,
  createDefaultDndStats,
  formatSigned,
  formatStat,
  withUpdatedAbility,
} from './dndStats';

describe('abilityModifier', () => {
  it('matches D&D 5e ability modifiers', () => {
    expect(abilityModifier(1)).toBe(-5);
    expect(abilityModifier(8)).toBe(-1);
    expect(abilityModifier(9)).toBe(-1);
    expect(abilityModifier(10)).toBe(0);
    expect(abilityModifier(11)).toBe(0);
    expect(abilityModifier(12)).toBe(1);
    expect(abilityModifier(15)).toBe(2);
    expect(abilityModifier(16)).toBe(3);
    expect(abilityModifier(20)).toBe(5);
  });
});

describe('formatSigned', () => {
  it('adds a plus for zero and positive values', () => {
    expect(formatSigned(0)).toBe('+0');
    expect(formatSigned(3)).toBe('+3');
    expect(formatSigned(-2)).toBe('-2');
  });
});

describe('formatStat', () => {
  it('renders empty values as blank for handwriting', () => {
    expect(formatStat(null)).toBe('');
    expect(formatStat(null, true)).toBe('');
    expect(formatStat(15)).toBe('15');
    expect(formatStat(2, true)).toBe('+2');
  });
});

describe('createDefaultDndStats', () => {
  it('starts with blank fill-in fields', () => {
    const stats = createDefaultDndStats();
    expect(stats.ac).toBeNull();
    expect(stats.classLevel).toBe('');
    expect(stats.race).toBe('');
    expect(stats.abilities.str).toBeNull();
    expect(stats.spellSaveDc).toBeNull();
    expect(stats.speed).toBe('');
    expect(stats.hpMax).toBeNull();
    expect(stats.initiative).toBeNull();
    expect(stats.passivePerception).toBeNull();
  });
});

describe('withUpdatedAbility', () => {
  it('stores the new score', () => {
    const next = withUpdatedAbility(createDefaultDndStats(), 'str', 16);
    expect(next.abilities.str).toBe(16);
  });

  it('can clear a score', () => {
    const stats = createDefaultDndStats();
    stats.abilities.dex = 14;
    const next = withUpdatedAbility(stats, 'dex', null);
    expect(next.abilities.dex).toBeNull();
  });

  it('clamps extreme scores', () => {
    const next = withUpdatedAbility(createDefaultDndStats(), 'dex', 99);
    expect(next.abilities.dex).toBe(30);
  });
});

describe('cloneDndStats', () => {
  it('deep-copies nested scores', () => {
    const original = createDefaultDndStats();
    original.abilities.str = 18;
    const copy = cloneDndStats(original);
    copy.abilities.str = 8;
    expect(original.abilities.str).toBe(18);
  });
});

describe('clamps', () => {
  it('falls back when the value is not a number', () => {
    expect(clampAbilityScore(Number.NaN)).toBe(10);
    expect(clampAc(Number.NaN)).toBe(10);
  });
});

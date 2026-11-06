import { describe, expect, it } from 'vitest';
import {
  OBJECT_PALETTES,
  getGameObjectCellHeight,
  getGameObjectCellWidth,
  type ObjectFramePattern,
} from '../constants';
import type { ObjectTheme } from '../types';
import {
  buildCardOuterFrame,
  buildPanelFrame,
  buildRarityDivider,
  buildRarityWatermark,
  buildScrollVector,
  buildStatIconSpec,
  buildStatsDivider,
  buildTailpieceFlourish,
  type ObjectStatKind,
} from './objectFrames';
import { descriptionZones, shirtZones } from './objectLayout';

const cellW = getGameObjectCellWidth();
const cellH = getGameObjectCellHeight();
const faceRect = { x: 0, y: 0, width: cellW, height: cellH };

const ALL_THEMES: ObjectTheme[] = [
  'common',
  'uncommon',
  'rare',
  'very_rare',
  'legendary',
  'artifact',
];

describe('BG3 rarity palettes & frame patterns', () => {
  it('assigns a unique frame pattern and Russian subtitle to every rarity tier', () => {
    const patterns = new Set<ObjectFramePattern>();
    const subtitles = new Set<string>();

    for (const theme of ALL_THEMES) {
      const palette = OBJECT_PALETTES[theme];
      expect(palette).toBeDefined();
      expect(palette.label.length).toBeGreaterThan(0);
      expect(palette.raritySubtitle.length).toBeGreaterThan(0);
      patterns.add(palette.pattern);
      subtitles.add(palette.raritySubtitle);
    }

    expect(patterns.size).toBe(ALL_THEMES.length);
    expect(subtitles.size).toBe(ALL_THEMES.length);
  });

  it('generates distinct outer frame, panel, divider and watermark vectors for each rarity', () => {
    const desc = descriptionZones(faceRect);
    const outerSignatures = new Set<string>();
    const watermarkSignatures = new Set<string>();

    for (const theme of ALL_THEMES) {
      const { pattern } = OBJECT_PALETTES[theme];
      const outer = buildCardOuterFrame(cellW, cellH, pattern);
      const plate = buildPanelFrame(desc.name, pattern, 'plate');
      const body = buildPanelFrame(desc.frame, pattern, 'body');
      const divider = buildRarityDivider(desc.label, pattern);
      const watermark = buildRarityWatermark(desc.frame, pattern);
      const tail = buildTailpieceFlourish(cellW / 2, desc.text.y + 20, desc.text.width, pattern);

      expect(outer.strokePaths.length).toBeGreaterThan(0);
      expect(outer.fillPaths.length).toBeGreaterThan(0);
      expect(plate.strokePaths.length).toBeGreaterThan(0);
      expect(body.strokePaths.length).toBeGreaterThan(0);
      expect(divider.strokePaths.length).toBe(2);
      expect(divider.fillPaths.length).toBeGreaterThan(0);
      expect(watermark.strokePaths.length + watermark.thinStrokePaths.length).toBeGreaterThan(0);
      expect(tail.strokePaths.length).toBe(2);

      outerSignatures.add([...outer.strokePaths, ...outer.thinStrokePaths, ...outer.fillPaths].join('|'));
      watermarkSignatures.add(
        [...watermark.strokePaths, ...watermark.thinStrokePaths, ...watermark.fillPaths].join('|')
      );
    }

    expect(outerSignatures.size).toBe(ALL_THEMES.length);
    expect(watermarkSignatures.size).toBe(ALL_THEMES.length);
  });

  it('keeps scroll spindles, caps and banner strictly inside the scroll zone', () => {
    const shirt = shirtZones(faceRect, true);
    const scroll = shirt.scroll!;
    const spec = buildScrollVector(scroll);

    expect(spec.leftRoller.x).toBeGreaterThanOrEqual(scroll.x - 1e-9);
    expect(spec.rightRoller.x + spec.rightRoller.width).toBeLessThanOrEqual(
      scroll.x + scroll.width + 1e-9
    );
    expect(spec.banner.x).toBeGreaterThan(spec.leftRoller.x);
    expect(spec.banner.x + spec.banner.width).toBeLessThan(
      spec.rightRoller.x + spec.rightRoller.width
    );
    expect(spec.textBox.x).toBeGreaterThan(spec.banner.x);
    expect(spec.textBox.width).toBeGreaterThan(0);
    expect(spec.caps).toHaveLength(4);
    for (const cap of spec.caps) {
      expect(cap.y).toBeGreaterThanOrEqual(scroll.y - 1e-9);
      expect(cap.y + cap.height).toBeLessThanOrEqual(scroll.y + scroll.height + 1e-9);
    }
  });

  it('builds BG3 stats divider and distinct vector icons for all four stat tag kinds', () => {
    const desc = descriptionZones(faceRect, 4);
    const divider = buildStatsDivider(desc.frame, desc.stats!.y, 'royal');
    expect(divider.thinStrokePaths).toHaveLength(2);
    expect(divider.fillPaths).toHaveLength(1);

    const kinds: ObjectStatKind[] = ['stat', 'weight', 'price', 'attunement'];
    const iconSignatures = new Set<string>();
    for (const kind of kinds) {
      const icon = buildStatIconSpec(kind, 10, 10, 1.2);
      expect(
        icon.strokePaths.length + icon.thinStrokePaths.length + icon.fillPaths.length
      ).toBeGreaterThan(0);
      iconSignatures.add(
        [...icon.strokePaths, ...icon.thinStrokePaths, ...icon.fillPaths].join('|')
      );
    }
    expect(iconSignatures.size).toBe(kinds.length);
  });
});

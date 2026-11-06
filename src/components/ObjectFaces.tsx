import { useId, useMemo, type CSSProperties } from 'react';
import type { GameObject, ImageFocus } from '../types';
import {
  OBJECT_PALETTES,
  getGameObjectCellHeight,
  getGameObjectCellWidth,
} from '../constants';
import {
  buildCardOuterFrame,
  buildPanelFrame,
  buildRarityDivider,
  buildRarityWatermark,
  buildScrollVector,
  buildStatIconSpec,
  buildStatsDivider,
  buildTailpieceFlourish,
  type FrameVectorSpec,
} from '../utils/objectFrames';
import {
  descriptionPreviewLayout,
  descriptionZones,
  fitObjectPreviewTypography,
  getObjectStatChips,
  shirtPreviewLayout,
  shirtZones,
  type PercentBox,
} from '../utils/objectLayout';
import { FilledCharacterImage } from './FilledCharacterImage';
import './ObjectFaces.css';

const CELL_W = getGameObjectCellWidth();
const CELL_H = getGameObjectCellHeight();
const FACE_RECT = { x: 0, y: 0, width: CELL_W, height: CELL_H };

const boxStyle = (box: PercentBox): CSSProperties => ({
  left: `${box.left}%`,
  top: `${box.top}%`,
  width: `${box.width}%`,
  height: `${box.height}%`,
});

function VectorSpecGroup({
  spec,
  stroke,
  thinStroke,
  fill,
  opacity = 1,
}: {
  spec: FrameVectorSpec;
  stroke: string;
  thinStroke: string;
  fill: string;
  opacity?: number;
}) {
  return (
    <g opacity={opacity} strokeLinecap="round" strokeLinejoin="round">
      {spec.strokePaths.map((d, i) => (
        <path
          key={`s-${i}`}
          d={d}
          fill="none"
          stroke={stroke}
          strokeWidth={spec.strokeWidthMm}
        />
      ))}
      {spec.thinStrokePaths.map((d, i) => (
        <path
          key={`t-${i}`}
          d={d}
          fill="none"
          stroke={thinStroke}
          strokeWidth={spec.thinStrokeWidthMm}
        />
      ))}
      {spec.fillPaths.map((d, i) => (
        <path key={`f-${i}`} d={d} fill={fill} stroke="none" />
      ))}
    </g>
  );
}

interface ObjectShirtFaceProps {
  object: GameObject;
  pannable?: boolean;
  onImageFocusChange?: (focus: ImageFocus) => void;
}

/** Shirt side: name band, unified paper window, image, ornate scroll, quantity medallion. */
export function ObjectShirtFace({
  object,
  pannable = false,
  onImageFocusChange,
}: ObjectShirtFaceProps) {
  const uid = useId();
  const palette = OBJECT_PALETTES[object.theme];
  const hasSlogan = object.slogan.trim() !== '';
  const layout = useMemo(() => shirtPreviewLayout(hasSlogan), [hasSlogan]);
  const zones = useMemo(() => shirtZones(FACE_RECT, hasSlogan), [hasSlogan]);
  const type = useMemo(
    () =>
      fitObjectPreviewTypography({
        name: object.name,
        slogan: object.slogan,
        description: object.description,
        quantity: object.quantity,
        stat: object.stat,
        weight: object.weight,
        price: object.price,
        attunement: object.attunement,
      }),
    [
      object.name,
      object.slogan,
      object.description,
      object.quantity,
      object.stat,
      object.weight,
      object.price,
      object.attunement,
    ]
  );

  const vectors = useMemo(() => {
    const outer = buildCardOuterFrame(CELL_W, CELL_H, palette.pattern);
    const windowFrame = buildPanelFrame(zones.window, palette.pattern, 'window');
    const scrollVec = zones.scroll ? buildScrollVector(zones.scroll) : null;
    return { outer, windowFrame, scrollVec };
  }, [palette.pattern, zones.window, zones.scroll]);

  const quantity = object.quantity;
  const showBadge = quantity !== null && Number.isFinite(quantity);
  const rollerGradId = `roller-grad-${uid}`;
  const bannerGradId = `banner-grad-${uid}`;

  return (
    <div
      className="object-face object-shirt"
      style={{
        background: `radial-gradient(circle at 50% 28%, ${palette.cardBgLight} 5%, ${palette.cardBg} 75%)`,
        borderRadius: `${layout.cornerRadiusPct}%`,
        color: palette.onCardBg,
      }}
    >
      <div
        className="object-window-panel"
        style={{
          ...boxStyle(layout.window),
          background: `linear-gradient(180deg, ${palette.paper} 0%, ${palette.paper} 85%, ${palette.paperDark} 100%)`,
        }}
      />

      <div className="object-image-window" style={boxStyle(layout.image)}>
        <FilledCharacterImage
          src={object.imageUrl}
          alt={object.name}
          imageFillMode={object.imageFillMode}
          imageFocus={object.imageFocus}
          pannable={pannable}
          onImageFocusChange={onImageFocusChange}
        />
      </div>

      <svg
        className="object-face-svg"
        viewBox={`0 0 ${CELL_W} ${CELL_H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <VectorSpecGroup
          spec={vectors.outer}
          stroke={palette.accent}
          thinStroke={palette.accent}
          fill={palette.accent}
          opacity={0.88}
        />
        <VectorSpecGroup
          spec={vectors.windowFrame}
          stroke={palette.frame}
          thinStroke={palette.accent}
          fill={palette.frame}
          opacity={0.95}
        />

        {vectors.scrollVec && (
          <g>
            <defs>
              <linearGradient id={rollerGradId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={palette.frame} />
                <stop offset="42%" stopColor={palette.accent} />
                <stop offset="100%" stopColor={palette.frame} />
              </linearGradient>
              <linearGradient id={bannerGradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={palette.paper} />
                <stop offset="85%" stopColor={palette.paper} />
                <stop offset="100%" stopColor={palette.paperDark} />
              </linearGradient>
            </defs>

            {vectors.scrollVec.caps.map((cap, idx) => (
              <rect
                key={`cap-${idx}`}
                x={cap.x}
                y={cap.y}
                width={cap.width}
                height={cap.height}
                rx={cap.width * 0.35}
                fill={palette.frame}
              />
            ))}

            <rect
              x={vectors.scrollVec.banner.x}
              y={vectors.scrollVec.banner.y}
              width={vectors.scrollVec.banner.width}
              height={vectors.scrollVec.banner.height}
              rx={vectors.scrollVec.banner.height * 0.08}
              fill={`url(#${bannerGradId})`}
              stroke={palette.frame}
              strokeWidth={0.24}
            />

            {vectors.scrollVec.rulePaths.map((d, idx) => (
              <path
                key={`rule-${idx}`}
                d={d}
                fill="none"
                stroke={palette.accent}
                strokeWidth={0.16}
                opacity={0.85}
              />
            ))}

            {[vectors.scrollVec.leftRoller, vectors.scrollVec.rightRoller].map((r, idx) => (
              <rect
                key={`roller-${idx}`}
                x={r.x}
                y={r.y}
                width={r.width}
                height={r.height}
                rx={r.width * 0.38}
                fill={`url(#${rollerGradId})`}
                stroke={palette.frame}
                strokeWidth={0.2}
              />
            ))}
          </g>
        )}
      </svg>

      {hasSlogan && layout.scrollText && (
        <div
          className="object-shirt-scroll-text"
          style={{
            ...boxStyle(layout.scrollText),
            color: palette.ink,
          }}
        >
          <span style={{ fontSize: `${type.sloganCqh}cqh` }}>{object.slogan}</span>
        </div>
      )}

      <div className="object-shirt-name" style={boxStyle(layout.name)}>
        <span style={{ fontSize: `${type.shirtNameCqh}cqh` }}>{object.name}</span>
      </div>

      {showBadge && (
        <div
          className="object-shirt-badge"
          style={{
            left: `${layout.badge.left}%`,
            top: `${layout.badge.top}%`,
            width: `${layout.badge.size}%`,
            background: `radial-gradient(circle at 35% 30%, ${palette.paper} 0%, ${palette.accent} 40%, ${palette.accent} 100%)`,
            color: palette.ink,
            borderColor: palette.frame,
            '--badge-inner-ring': palette.paper,
          } as CSSProperties}
        >
          <span style={{ fontSize: `${type.badgeCqh}cqh` }}>
            {String(Math.max(0, Math.round(quantity)))}
          </span>
        </div>
      )}
    </div>
  );
}

/** Description side: name plaque, rarity divider, framed parchment with watermark, justified text & BG3 stats. */
export function ObjectDescriptionFace({ object }: { object: GameObject }) {
  const palette = OBJECT_PALETTES[object.theme];
  const chips = useMemo(
    () =>
      getObjectStatChips({
        stat: object.stat,
        weight: object.weight,
        price: object.price,
        attunement: object.attunement,
      }),
    [object.stat, object.weight, object.price, object.attunement]
  );
  const layout = useMemo(() => descriptionPreviewLayout(chips), [chips]);
  const zones = useMemo(() => descriptionZones(FACE_RECT, chips.length), [chips.length]);
  const type = useMemo(
    () =>
      fitObjectPreviewTypography({
        name: object.name,
        slogan: object.slogan,
        description: object.description,
        quantity: object.quantity,
        stat: object.stat,
        weight: object.weight,
        price: object.price,
        attunement: object.attunement,
      }),
    [
      object.name,
      object.slogan,
      object.description,
      object.quantity,
      object.stat,
      object.weight,
      object.price,
      object.attunement,
    ]
  );

  const vectors = useMemo(() => {
    const outer = buildCardOuterFrame(CELL_W, CELL_H, palette.pattern);
    const plateFrame = buildPanelFrame(zones.name, palette.pattern, 'plate');
    const divider = buildRarityDivider(zones.label, palette.pattern);
    const watermark = buildRarityWatermark(zones.frame, palette.pattern);
    const bodyFrame = buildPanelFrame(zones.frame, palette.pattern, 'body');
    const tailpiece =
      type.tailpieceY !== null
        ? buildTailpieceFlourish(CELL_W / 2, type.tailpieceY, zones.text.width, palette.pattern)
        : null;
    const statsDivider = zones.stats
      ? buildStatsDivider(zones.frame, zones.stats.y, palette.pattern)
      : null;
    const statIcons = layout.statChips.map((chip) =>
      buildStatIconSpec(chip.kind, chip.icon.cx, chip.icon.cy, chip.icon.r)
    );
    return {
      outer,
      plateFrame,
      divider,
      watermark,
      bodyFrame,
      tailpiece,
      statsDivider,
      statIcons,
    };
  }, [palette.pattern, zones, type.tailpieceY, layout.statChips]);

  return (
    <div
      className="object-face object-description"
      style={{
        background: `radial-gradient(circle at 50% 28%, ${palette.cardBgLight} 5%, ${palette.cardBg} 75%)`,
        borderRadius: `${layout.cornerRadiusPct}%`,
      }}
    >
      <div
        className="object-desc-name"
        style={{
          ...boxStyle(layout.name),
          background: `linear-gradient(180deg, ${palette.paper} 0%, ${palette.paperDark} 100%)`,
          color: palette.ink,
        }}
      >
        <span style={{ fontSize: `${type.descNameCqh}cqh` }}>{object.name}</span>
      </div>

      <div
        className="object-desc-label"
        style={{ ...boxStyle(layout.label), color: palette.onCardBg }}
      >
        <span style={{ fontSize: `${type.labelCqh}cqh` }}>{palette.raritySubtitle}</span>
      </div>

      <div
        className="object-desc-frame"
        style={{
          ...boxStyle(layout.frame),
          background: `linear-gradient(180deg, ${palette.paper} 0%, ${palette.paper} 85%, ${palette.paperDark} 100%)`,
        }}
      />

      <svg
        className="object-face-svg"
        viewBox={`0 0 ${CELL_W} ${CELL_H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <VectorSpecGroup
          spec={vectors.outer}
          stroke={palette.accent}
          thinStroke={palette.accent}
          fill={palette.accent}
          opacity={0.88}
        />
        <VectorSpecGroup
          spec={vectors.plateFrame}
          stroke={palette.frame}
          thinStroke={palette.accent}
          fill={palette.frame}
          opacity={0.95}
        />
        <VectorSpecGroup
          spec={vectors.divider}
          stroke={palette.accent}
          thinStroke={palette.accent}
          fill={palette.accent}
          opacity={0.9}
        />
        <VectorSpecGroup
          spec={vectors.watermark}
          stroke={palette.frame}
          thinStroke={palette.frame}
          fill={palette.frame}
          opacity={0.085}
        />
        <VectorSpecGroup
          spec={vectors.bodyFrame}
          stroke={palette.frame}
          thinStroke={palette.accent}
          fill={palette.frame}
          opacity={0.95}
        />
        {vectors.tailpiece && (
          <VectorSpecGroup
            spec={vectors.tailpiece}
            stroke={palette.frame}
            thinStroke={palette.accent}
            fill={palette.accent}
            opacity={0.55}
          />
        )}
        {vectors.statsDivider && (
          <VectorSpecGroup
            spec={vectors.statsDivider}
            stroke={palette.frame}
            thinStroke={palette.frame}
            fill={palette.accent}
            opacity={0.75}
          />
        )}
        {vectors.statIcons.map((iconSpec, idx) => (
          <VectorSpecGroup
            key={`stat-icon-${idx}`}
            spec={iconSpec}
            stroke={palette.frame}
            thinStroke={palette.frame}
            fill={palette.frame}
            opacity={0.9}
          />
        ))}
      </svg>

      <div
        className="object-desc-text"
        style={{ ...boxStyle(layout.text), color: palette.ink }}
      >
        <span style={{ fontSize: `${type.textCqh}cqh` }}>{object.description}</span>
      </div>

      {layout.statChips.map((chip, idx) => (
        <div
          key={`${chip.kind}-${idx}`}
          className="object-desc-stat-text"
          style={{ ...boxStyle(chip.textBox), color: palette.ink }}
        >
          <span style={{ fontSize: `${type.statCqh}cqh` }}>{chip.text}</span>
        </div>
      ))}
    </div>
  );
}

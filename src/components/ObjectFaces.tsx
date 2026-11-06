import { useMemo, type CSSProperties } from 'react';
import type { GameObject } from '../types';
import { OBJECT_PALETTES } from '../constants';
import {
  descriptionPreviewLayout,
  objectPreviewTypography,
  shirtPreviewLayout,
  type PercentBox,
} from '../utils/objectLayout';
import './ObjectFaces.css';

const boxStyle = (box: PercentBox): CSSProperties => ({
  left: `${box.left}%`,
  top: `${box.top}%`,
  width: `${box.width}%`,
  height: `${box.height}%`,
});

/** Shirt side: name band, paper image window, slogan scroll, quantity badge. */
export function ObjectShirtFace({ object }: { object: GameObject }) {
  const palette = OBJECT_PALETTES[object.theme];
  const hasSlogan = object.slogan.trim() !== '';
  const layout = useMemo(() => shirtPreviewLayout(hasSlogan), [hasSlogan]);
  const type = objectPreviewTypography();
  const quantity = object.quantity;
  const showBadge = quantity !== null && Number.isFinite(quantity);

  return (
    <div
      className="object-face object-shirt"
      style={{
        background: palette.cardBg,
        borderRadius: `${layout.cornerRadiusPct}%`,
        color: palette.onCardBg,
      }}
    >
      <div className="object-shirt-name" style={boxStyle(layout.name)}>
        <span style={{ fontSize: `${type.nameCqh}cqh` }}>{object.name}</span>
      </div>

      <div
        className="object-image-window"
        style={{ ...boxStyle(layout.image), background: palette.paper }}
      >
        <img src={object.imageUrl} alt={object.name} loading="lazy" />
      </div>

      {hasSlogan && layout.scroll && (
        <div
          className="object-shirt-scroll"
          style={
            {
              ...boxStyle(layout.scroll),
              background: palette.paper,
              color: palette.ink,
              '--roller-color': palette.accent,
            } as CSSProperties
          }
        >
          <span style={{ fontSize: `${type.sloganCqh}cqh` }}>{object.slogan}</span>
        </div>
      )}

      {showBadge && (
        <div
          className="object-shirt-badge"
          style={{
            left: `${layout.badge.left}%`,
            top: `${layout.badge.top}%`,
            width: `${layout.badge.size}%`,
            background: palette.accent,
            color: palette.ink,
            borderColor: palette.frame,
          }}
        >
          <span style={{ fontSize: `${type.badgeCqh}cqh` }}>
            {String(Math.max(0, Math.round(quantity)))}
          </span>
        </div>
      )}
    </div>
  );
}

/** Description side: name plate, «Описание» label and the justified text frame. */
export function ObjectDescriptionFace({ object }: { object: GameObject }) {
  const palette = OBJECT_PALETTES[object.theme];
  const layout = useMemo(() => descriptionPreviewLayout(), []);
  const type = objectPreviewTypography();

  return (
    <div
      className="object-face object-description"
      style={{
        background: palette.cardBg,
        borderRadius: `${layout.cornerRadiusPct}%`,
      }}
    >
      <div
        className="object-desc-name"
        style={{ ...boxStyle(layout.name), background: palette.paper, color: palette.ink }}
      >
        <span style={{ fontSize: `${type.nameCqh}cqh` }}>{object.name}</span>
      </div>

      <div
        className="object-desc-label"
        style={{ ...boxStyle(layout.label), color: palette.onCardBg }}
      >
        <span style={{ fontSize: `${type.labelCqh}cqh` }}>Описание</span>
      </div>

      <div
        className="object-desc-frame"
        style={{
          ...boxStyle(layout.frame),
          background: palette.paper,
          borderColor: palette.frame,
        }}
      >
        <div
          className="object-desc-text"
          style={{ ...boxStyle(layout.text), color: palette.ink }}
        >
          <span style={{ fontSize: `${type.textCqh}cqh` }}>{object.description}</span>
        </div>
      </div>
    </div>
  );
}

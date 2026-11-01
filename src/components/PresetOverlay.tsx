import type { NameBackgroundType, NameSettings } from '../types';
import { getPresetOverlay } from '../utils/presetOverlays';
import { getNameCssOverride, isLocalNameFont } from '../utils/nameFont';
import { FittedName } from './FittedName';

interface PresetOverlayProps {
  preset: NameBackgroundType;
  name: string;
  font: NameSettings['font'];
  fontSizePercent: NameSettings['fontSizePercent'];
}

export function PresetOverlay({ preset, name, font, fontSizePercent }: PresetOverlayProps) {
  const meta = getPresetOverlay(preset);
  if (!meta) return null;

  const { nameBox } = meta;

  return (
    <div className="preset-overlay">
      <img className="preset-overlay-img" src={meta.src} alt="" draggable={false} />
      {name.trim() !== '' && (
        <div
          className={`preset-name ${isLocalNameFont(font) ? '' : `name-font-${font}`}`}
          style={{
            left: `${nameBox.x * 100}%`,
            top: `${nameBox.y * 100}%`,
            width: `${nameBox.w * 100}%`,
            height: `${nameBox.h * 100}%`,
            color: meta.textColor,
            ...getNameCssOverride(font),
          }}
        >
          <FittedName text={name} font={font} fontSizePercent={fontSizePercent} />
        </div>
      )}
    </div>
  );
}

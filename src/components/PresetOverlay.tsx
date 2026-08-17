import type { NameBackgroundType, NameSettings } from '../types';
import { getPresetOverlay } from '../utils/presetOverlays';

interface PresetOverlayProps {
  preset: NameBackgroundType;
  name: string;
  font: NameSettings['font'];
  blockSize: NameSettings['blockSize'];
}

export function PresetOverlay({ preset, name, font, blockSize }: PresetOverlayProps) {
  const meta = getPresetOverlay(preset);
  if (!meta) return null;

  const { nameBox } = meta;

  return (
    <div className="preset-overlay">
      <img className="preset-overlay-img" src={meta.src} alt="" draggable={false} />
      {name.trim() !== '' && (
        <div
          className={`preset-name name-font-${font} preset-size-${blockSize}`}
          style={{
            left: `${nameBox.x * 100}%`,
            top: `${nameBox.y * 100}%`,
            width: `${nameBox.w * 100}%`,
            height: `${nameBox.h * 100}%`,
            color: meta.textColor,
          }}
        >
          {name}
        </div>
      )}
    </div>
  );
}

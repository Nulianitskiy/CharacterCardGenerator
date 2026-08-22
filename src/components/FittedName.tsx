import { useLayoutEffect, useRef, useState } from 'react';
import type { BlockSizeOption, FontOption } from '../types';
import {
  ensureNameFontsLoaded,
  getNameSizeScale,
  layoutFittedName,
  measureNameWithCanvas,
} from '../utils/nameLabelRender';

interface FittedNameProps {
  text: string;
  font: FontOption;
  blockSize: BlockSizeOption;
}

export function FittedName({ text, font, blockSize }: FittedNameProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState(() => ({
    fontSize: 12,
    lines: text.trim() ? [text.trim()] : [],
    lineHeight: 13,
  }));

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    const fit = () => {
      const width = box.clientWidth;
      const height = box.clientHeight;
      if (width < 2 || height < 2) return;
      setLayout(
        layoutFittedName(
          text,
          width,
          height,
          (fontSize, value) => measureNameWithCanvas(font, fontSize, value),
          getNameSizeScale(blockSize)
        )
      );
    };

    const observer = new ResizeObserver(fit);
    observer.observe(box);
    fit();
    void ensureNameFontsLoaded().then(fit);

    return () => observer.disconnect();
  }, [text, font, blockSize]);

  return (
    <div ref={boxRef} className="fitted-name">
      {layout.lines.map((line, index) => (
        <span
          key={`${index}-${line}`}
          className="fitted-name-line"
          style={{ fontSize: layout.fontSize, lineHeight: `${layout.lineHeight}px` }}
        >
          {line}
        </span>
      ))}
    </div>
  );
}

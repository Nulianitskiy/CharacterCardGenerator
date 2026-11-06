/**
 * Pure justified-text engine for object description faces (and later any
 * wrapped print text).
 *
 * Measurement is injected as a callback, so the layout algorithm runs in Node
 * tests without a canvas/DOM. The PDF renderer supplies a canvas `measureText`
 * bound to the chosen font; the screen only needs the overflow verdict.
 */

/** Width of a rendered string in the caller's units. */
export type MeasureText = (text: string) => number;

/** Builds a measure function for a given font size (e.g. canvas font state). */
export type MakeMeasure = (fontSize: number) => MeasureText;

/**
 * Greedy word wrap preserving explicit line breaks. A word longer than the
 * line is kept whole (printers clip, they don't hyphenate in v1).
 */
export const wrapLines = (text: string, maxWidth: number, measure: MeasureText): string[] => {
  const lines: string[] = [];

  for (const paragraph of text.split('\n')) {
    const words = paragraph.split(/\s+/).filter((word) => word.length > 0);
    if (words.length === 0) {
      lines.push('');
      continue;
    }

    let current = words[0];
    for (let i = 1; i < words.length; i++) {
      const candidate = `${current} ${words[i]}`;
      if (measure(candidate) <= maxWidth) {
        current = candidate;
      } else {
        lines.push(current);
        current = words[i];
      }
    }
    lines.push(current);
  }

  return lines;
};

export interface JustifiedLine {
  /** Words to draw in order. */
  words: string[];
  /** Extra width to add after every word except the last (0 for the final line). */
  gapStretch: number;
}

/**
 * Pre-computes the extra inter-word gap for stretching one wrapped line to
 * `maxWidth`. The last line of a paragraph must not stretch — pass it through
 * `isLastLine`.
 */
export const justifyLine = (
  line: string,
  maxWidth: number,
  measure: MeasureText,
  isLastLine = false
): JustifiedLine => {
  const words = line.split(/\s+/).filter((word) => word.length > 0);
  if (isLastLine || words.length < 2) {
    return { words, gapStretch: 0 };
  }
  const natural = measure(words.join(' '));
  const stretch = Math.max(0, (maxWidth - natural) / (words.length - 1));
  return { words, gapStretch: stretch };
};

export interface TextFitRequest {
  text: string;
  /** Usable box for the text run. */
  width: number;
  height: number;
  baseFontSize: number;
  /** Shrink steps until this floor; below it the text is reported as overflow. */
  minFontSize: number;
  lineHeightFactor: number;
  makeMeasure: MakeMeasure;
}

export interface TextFit {
  fontSize: number;
  lines: string[];
  /** True when even `minFontSize` cannot fit all lines into `height`. */
  overflow: boolean;
  lineHeight: number;
}

/**
 * Finds the largest font size in the [minFontSize, baseFontSize] range at
 * which the wrapped text fits the box. Monotonic in font size (smaller font ⇒
 * never more lines), so binary search is exact for the step-free domain.
 */
export const fitJustifiedText = (request: TextFitRequest): TextFit => {
  const { text, width, height, baseFontSize, minFontSize, lineHeightFactor, makeMeasure } = request;

  const layout = (fontSize: number) => {
    const lines = wrapLines(text, width, makeMeasure(fontSize));
    const lineHeight = fontSize * lineHeightFactor;
    return { lines, lineHeight, fits: lines.length * lineHeight <= height };
  };

  if (text.trim() === '') {
    return { fontSize: baseFontSize, lines: [], overflow: false, lineHeight: baseFontSize * lineHeightFactor };
  }

  const atBase = layout(baseFontSize);
  if (atBase.fits) {
    return { fontSize: baseFontSize, lines: atBase.lines, lineHeight: atBase.lineHeight, overflow: false };
  }

  const atMin = layout(minFontSize);
  if (!atMin.fits) {
    // Nothing fits: render what fits at the floor and flag the rest.
    const maxLines = Math.floor(height / atMin.lineHeight);
    return {
      fontSize: minFontSize,
      lines: atMin.lines.slice(0, Math.max(0, maxLines)),
      overflow: true,
      lineHeight: atMin.lineHeight,
    };
  }

  // Binary search the largest size that fits (keep at least minFontSize).
  let lo = minFontSize;
  let hi = baseFontSize;
  let best = atMin;
  for (let step = 0; step < 12 && hi - lo > 0.01; step++) {
    const mid = (lo + hi) / 2;
    const candidate = layout(mid);
    if (candidate.fits) {
      lo = mid;
      best = candidate;
    } else {
      hi = mid;
    }
  }

  return { fontSize: lo, lines: best.lines, lineHeight: best.lineHeight, overflow: false };
};

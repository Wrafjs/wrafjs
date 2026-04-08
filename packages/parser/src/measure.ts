import { resolveTextSize } from "./text-sizes.js";

export interface FontDescriptor {
  charWidthRatio:    number;
  horizontalPadding: number;
  fontFamily:        string;
}

export const MONOSPACE_FONT: FontDescriptor = {
  charWidthRatio:    0.60,
  horizontalPadding: 12,
  fontFamily:        "'Consolas','Monaco','Menlo',monospace",
};

export interface TextMeasurement {
  lineWidth:  number;
  fontSize:   number;
  lineHeight: number;
  charWidth:  number;
}

export function measureText(
  text:  string,
  size?: number | string,
  font:  FontDescriptor = MONOSPACE_FONT,
): TextMeasurement {
  const spec      = resolveTextSize(size);
  const charWidth = spec.fontSize * font.charWidthRatio;
  const lineWidth = text.length * charWidth + font.horizontalPadding;
  const lineHeight = spec.fontSize * spec.lineHeight;
  return { lineWidth, fontSize: spec.fontSize, lineHeight, charWidth };
}

export function wrapTextLines(
  text:     string,
  maxWidth: number,
  size?:    number | string,
  font:     FontDescriptor = MONOSPACE_FONT,
): string[] {
  const { charWidth } = measureText("", size, font);
  const maxChars = Math.max(1, Math.floor(maxWidth / charWidth));
  const words    = text.split(" ");
  const lines:   string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [text];
}

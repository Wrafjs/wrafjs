export interface TextSizeSpec {
  /** Font size in px. */
  fontSize:   number;
  /** CSS font-weight value. */
  fontWeight: "normal" | "bold";
  /** Approximate line-height multiplier. */
  lineHeight: number;
}

export const TEXT_SIZES: Record<string, TextSizeSpec> = {
  // ── variant: named presets (canonical) ───────────────────────────────────
  display:    { fontSize: 36, fontWeight: "bold",   lineHeight: 1.2  },
  title:      { fontSize: 28, fontWeight: "bold",   lineHeight: 1.25 },
  heading:    { fontSize: 22, fontWeight: "bold",   lineHeight: 1.3  },
  subheading: { fontSize: 18, fontWeight: "bold",   lineHeight: 1.35 },
  body:       { fontSize: 15, fontWeight: "normal", lineHeight: 1.4  },
  caption:    { fontSize: 13, fontWeight: "normal", lineHeight: 1.5  },
  overline:   { fontSize: 11, fontWeight: "bold",   lineHeight: 1.6  },
  annotation: { fontSize: 11, fontWeight: "normal", lineHeight: 1.6  },
  // ── h1–h6: HTML heading aliases ──────────────────────────────────────────
  h1: { fontSize: 36, fontWeight: "bold",   lineHeight: 1.2  },
  h2: { fontSize: 28, fontWeight: "bold",   lineHeight: 1.25 },
  h3: { fontSize: 22, fontWeight: "bold",   lineHeight: 1.3  },
  h4: { fontSize: 18, fontWeight: "bold",   lineHeight: 1.35 },
  h5: { fontSize: 15, fontWeight: "bold",   lineHeight: 1.4  },
  h6: { fontSize: 13, fontWeight: "bold",   lineHeight: 1.5  },
  // ── size: numeric aliases (backward compat) ───────────────────────────────
  1: { fontSize: 36, fontWeight: "bold",   lineHeight: 1.2  },
  2: { fontSize: 28, fontWeight: "bold",   lineHeight: 1.25 },
  3: { fontSize: 22, fontWeight: "bold",   lineHeight: 1.3  },
  4: { fontSize: 18, fontWeight: "bold",   lineHeight: 1.35 },
  5: { fontSize: 15, fontWeight: "normal", lineHeight: 1.4  },
  6: { fontSize: 13, fontWeight: "normal", lineHeight: 1.5  },
};

export const TEXT_SIZE_DEFAULT: TextSizeSpec = {
  fontSize:   13,
  fontWeight: "normal",
  lineHeight: 1.5,
};

export function resolveTextSize(size: string | number | undefined): TextSizeSpec {
  if (size === undefined) return TEXT_SIZE_DEFAULT;
  if (typeof size === "string") {
    const named = TEXT_SIZES[size.toLowerCase()];
    if (named) return named;
  }
  const n = typeof size === "number" ? size : parseInt(String(size), 10);
  return isNaN(n) ? TEXT_SIZE_DEFAULT : (TEXT_SIZES[n] ?? TEXT_SIZE_DEFAULT);
}

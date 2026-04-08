// ── SceneDefaults ─────────────────────────────────────────────────────────────
//
// Fixed visual constants used by scene-builder. All colors are calibrated for
// the light-mode SketchPainter (SKETCH_THEME: #faf8f4 bg, #2a2a2a stroke).
// These values are package constants — not user-configurable.

export interface SceneDefaults {
  button: {
    radius:          number;
    disabledOpacity: number;
    fontXs: number; fontSm: number; fontMd: number; fontLg: number; fontXl: number;
    primaryFill:     string; primaryStroke:   string; primaryText:   string;
    secondaryFill:   string; secondaryStroke: string; secondaryText: string;
    dangerFill:      string; dangerStroke:    string; dangerText:    string;
    ghostFill:       string; ghostStroke:     string; ghostText:     string;
    linkStroke:      string; linkText:        string;
    defaultFill:     string; defaultStroke:   string; defaultText:   string;
  };

  checkbox: {
    indicatorSize:   number;
    labelGap:        number;
    stroke:          string;
    disabledStroke:  string;
    checkedFill:     string;
    checkColor:      string;
    radius:          number;
  };

  card: {
    fill:         string;
    stroke:       string;
    radius:       number;
    headerHeight: number;
    headerFill:   string;
    headerBorder: string;
  };

  modal: {
    fill:         string;
    stroke:       string;
    radius:       number;
    opacity:      number;
    headerHeight: number;
    headerFill:   string;
    headerBorder: string;
    closeAlpha:   string;
  };

  drawer: {
    fill:         string;
    stroke:       string;
    headerHeight: number;
    headerFill:   string;
    headerBorder: string;
    closeAlpha:   string;
  };

  tablerow: {
    selectedFill:        string;
    selectedAccent:      string;
    selectedAccentWidth: number;
    disabledOpacity:     number;
    cellSkeletonOpacity: number;
    cellSkeletonRadius:  number;
    selectedSkeletonFill: string;
    dividerAlpha:        string;
    borderAlpha:         string;
  };

  listitem: {
    iconSize:       number;
    iconFill:       string;
    iconStroke:     string;
    iconSymbolSize: number;
    separatorAlpha: string;
    subtitleAlpha:  string;
    twoLineOffset:  number;
    iconTextGap:    number;
  };

  pagination: {
    buttonWidth:  number;
    buttonGap:    number;
    activeFill:   string;
    activeText:   string;
    radius:       number;
    mutedOpacity: number;
  };

  tabbar: {
    fill:        string;
    stroke:      string;
    borderColor: string;
  };

  tab: {
    activeFill:        string;
    activeAccent:      string;
    activeAccentWidth: number;
    radius:            number;
    inactiveAlpha:     string;
  };

  navbar: {
    fill:        string;
    stroke:      string;
    borderColor: string;
  };

  image: {
    fill:       string;
    stroke:     string;
    radius:     number;
    innerColor: string;
  };

  alert: {
    accentWidth:   number;
    radius:        number;
    defaultFill:   string; defaultStroke:  string; defaultAccent:  string;
    primaryFill:   string; primaryStroke:  string; primaryAccent:  string;
    successFill:   string; successStroke:  string; successAccent:  string;
    warningFill:   string; warningStroke:  string; warningAccent:  string;
    dangerFill:    string; dangerStroke:   string; dangerAccent:   string;
  };

  skeleton: {
    fill:        string;
    lineHeight:  number;
    lineSpacing: number;
    radius:      number;
    opacity:     number;
  };

  badge: {
    textColor:   string;
    defaultFill: string;
    primaryFill: string;
    successFill: string;
    warningFill: string;
    dangerFill:  string;
  };

  avatar: {
    colors:    string[];
    textColor: string;
  };

  progress: {
    trackFill:   string;
    trackStroke: string;
    radius:      number;
    fill:        string;
  };

  toggle: {
    checkedTrack:    string;
    checkedStroke:   string;
    uncheckedTrack:  string;
    uncheckedStroke: string;
    thumbColor:      string;
    disabledOpacity: number;
  };

  radio: {
    stroke:        string;
    radius:        number;
    checkedFill:   string;
    disabledAlpha: string;
  };

  select: {
    fill:             string;
    stroke:           string;
    radius:           number;
    placeholderAlpha: string;
    chevronAlpha:     string;
    requiredColor:    string;
  };

  input: {
    caretAlpha: string;
  };

  slider: {
    thumbRadius: number;
    thumbFill:   string;
    thumbStroke: string;
  };

  spinner: {
    stroke: string;
  };

  hasText: {
    line1Alpha: string;
    line2Alpha: string;
  };
}

// ── Light-mode defaults (calibrated for SKETCH_THEME) ─────────────────────────

export const DEFAULT_SCENE_DEFAULTS: SceneDefaults = {
  button: {
    radius:          4,
    disabledOpacity: 0.4,
    fontXs: 10, fontSm: 11, fontMd: 12, fontLg: 13, fontXl: 14,
    primaryFill:     "#2a2a2a", primaryStroke:   "#1a1a1a", primaryText:   "#faf8f4",
    secondaryFill:   "transparent", secondaryStroke: "#2a2a2a", secondaryText: "#2a2a2a",
    dangerFill:      "#c03030", dangerStroke:    "#a02020", dangerText:    "#ffffff",
    ghostFill:       "transparent", ghostStroke:     "#8a8a8a", ghostText:     "#3a3a3a",
    linkStroke:      "none",    linkText:        "#2a5aaa",
    defaultFill:     "#ede9df", defaultStroke:   "#2a2a2a", defaultText:   "#1a1a1a",
  },

  checkbox: {
    indicatorSize:  14,
    labelGap:        7,
    stroke:          "#2a2a2a",
    disabledStroke:  "#2a2a2a55",
    checkedFill:     "#2a2a2a",
    checkColor:      "#faf8f4",
    radius:          2,
  },

  card: {
    fill:         "#f4f0e8",
    stroke:       "#2a2a2a",
    radius:       8,
    headerHeight: 40,
    headerFill:   "#ede9df",
    headerBorder: "#2a2a2a",
  },

  modal: {
    fill:         "#faf8f4",
    stroke:       "#2a2a2a",
    radius:       8,
    opacity:      0.97,
    headerHeight: 40,
    headerFill:   "#f4f0e8",
    headerBorder: "#2a2a2a",
    closeAlpha:   "88",
  },

  drawer: {
    fill:         "#f4f0e8",
    stroke:       "#2a2a2a",
    headerHeight: 40,
    headerFill:   "#ede9df",
    headerBorder: "#2a2a2a",
    closeAlpha:   "88",
  },

  tablerow: {
    selectedFill:        "#e8e4dc",
    selectedAccent:      "#2a2a2a",
    selectedAccentWidth: 3,
    disabledOpacity:     0.35,
    cellSkeletonOpacity: 0.5,
    cellSkeletonRadius:  4,
    selectedSkeletonFill: "#2a2a2a30",
    dividerAlpha:        "33",
    borderAlpha:         "44",
  },

  listitem: {
    iconSize:       28,
    iconFill:       "#ede9df",
    iconStroke:     "#2a2a2a",
    iconSymbolSize: 12,
    separatorAlpha: "33",
    subtitleAlpha:  "77",
    twoLineOffset:  8,
    iconTextGap:    10,
  },

  pagination: {
    buttonWidth:  32,
    buttonGap:    4,
    activeFill:   "#2a2a2a",
    activeText:   "#faf8f4",
    radius:       4,
    mutedOpacity: 0.4,
  },

  tabbar: {
    fill:        "#f4f0e8",
    stroke:      "#2a2a2a",
    borderColor: "#2a2a2a",
  },

  tab: {
    activeFill:        "#ede9df",
    activeAccent:      "#2a2a2a",
    activeAccentWidth: 2,
    radius:            4,
    inactiveAlpha:     "88",
  },

  navbar: {
    fill:        "#f4f0e8",
    stroke:      "#2a2a2a",
    borderColor: "#2a2a2a",
  },

  image: {
    fill:       "#ede9df",
    stroke:     "#2a2a2a",
    radius:     4,
    innerColor: "#ddd8ce",
  },

  alert: {
    accentWidth:  4,
    radius:       4,
    defaultFill:  "#f4f0e8", defaultStroke:  "#2a2a2a", defaultAccent:  "#8a8a8a",
    primaryFill:  "#e8eef8", primaryStroke:  "#2a4a9a", primaryAccent:  "#2a4a9a",
    successFill:  "#e8f4ec", successStroke:  "#2a7a3a", successAccent:  "#2a7a3a",
    warningFill:  "#f8f0e0", warningStroke:  "#8a6010", warningAccent:  "#c08020",
    dangerFill:   "#f8e8e8", dangerStroke:   "#902020", dangerAccent:   "#c03030",
  },

  skeleton: {
    fill:        "#d8d4ca",
    lineHeight:  12,
    lineSpacing: 20,
    radius:      4,
    opacity:     0.7,
  },

  badge: {
    textColor:   "#faf8f4",
    defaultFill: "#8a8a8a",
    primaryFill: "#2a4a9a",
    successFill: "#2a7a3a",
    warningFill: "#9a7010",
    dangerFill:  "#902020",
  },

  avatar: {
    colors: [
      "#5a7aaa", "#7a6acd", "#3a8a7a", "#9a5a7a",
      "#5a8aaa", "#8a7040", "#3a9a9a", "#9a5050",
    ],
    textColor: "#ffffff",
  },

  progress: {
    trackFill:   "#ede9df",
    trackStroke: "#2a2a2a",
    radius:      2,
    fill:        "#2a2a2a",
  },

  toggle: {
    checkedTrack:    "#2a2a2a",
    checkedStroke:   "#1a1a1a",
    uncheckedTrack:  "#d0ccc2",
    uncheckedStroke: "#2a2a2a",
    thumbColor:      "#faf8f4",
    disabledOpacity: 0.4,
  },

  radio: {
    stroke:        "#2a2a2a",
    radius:        7,
    checkedFill:   "#2a2a2a",
    disabledAlpha: "55",
  },

  select: {
    fill:             "#faf8f4",
    stroke:           "#2a2a2a",
    radius:           4,
    placeholderAlpha: "55",
    chevronAlpha:     "99",
    requiredColor:    "#c03030",
  },

  input: {
    caretAlpha: "88",
  },

  slider: {
    thumbRadius: 6,
    thumbFill:   "#2a2a2a",
    thumbStroke: "#1a1a1a",
  },

  spinner: {
    stroke: "#2a2a2a",
  },

  hasText: {
    line1Alpha: "55",
    line2Alpha: "33",
  },
};

/**
 * Deep-merges a partial SceneDefaults override over the defaults.
 * Only the second level is merged (per-control objects are spread).
 */
export function applySceneDefaults(overrides?: Partial<SceneDefaults>): SceneDefaults {
  if (!overrides) return DEFAULT_SCENE_DEFAULTS;
  const merged = { ...DEFAULT_SCENE_DEFAULTS } as Record<string, unknown>;
  for (const [key, val] of Object.entries(overrides)) {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      merged[key] = { ...(merged[key] as object), ...val };
    } else {
      merged[key] = val;
    }
  }
  return merged as unknown as SceneDefaults;
}

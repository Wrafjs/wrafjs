import type { ResolvedBox, ResolvedScreen } from "@wrafjs/layout";
import { propValue } from "@wrafjs/layout";
import { getControl, resolveTextSize } from "@wrafjs/controls";
import type { RenderHints } from "@wrafjs/controls";
import { RectItem, TextItem, LineItem, CircleItem, IconItem } from "./types.js";
import type { DrawCall, Scene, Theme } from "./types.js";
import { applySceneDefaults } from "./scene-defaults.js";
import type { SceneDefaults } from "./scene-defaults.js";

// ── Helpers ────────────────────────────────────────────────────────────────────

function prop(box: ResolvedBox, key: string): string | number | boolean | undefined {
  const v = propValue(box.node, key);
  if (v !== undefined) return v as string | number | boolean;
  return getControl(box.node.type.toLowerCase())?.defaults?.[key];
}

function propStr(box: ResolvedBox, key: string): string | undefined {
  const v = prop(box, key);
  return v !== undefined ? String(v) : undefined;
}

function propNum(box: ResolvedBox, key: string, fallback?: number): number {
  const v = prop(box, key);
  if (v === undefined) return fallback ?? 0;
  const n = Number(v);
  return isNaN(n) ? (fallback ?? 0) : n;
}

function displayText(box: ResolvedBox): string {
  return (
    propStr(box, "text") ??
    propStr(box, "label") ??
    propStr(box, "title") ??
    propStr(box, "placeholder") ??
    ""
  );
}

// ── Per-kind item factories ────────────────────────────────────────────────────

function buildRect(box: ResolvedBox, hints: RenderHints | undefined, theme: Theme): RectItem {
  return new RectItem(
    box.x, box.y, box.width, box.height,
    hints?.fill    ?? theme.defaultFill,
    hints?.stroke  ?? theme.defaultStroke,
    hints?.radius  ?? 0,
    hints?.opacity ?? 1,
  );
}

interface ButtonStyle {
  fill:      string;
  stroke:    string;
  opacity:   number;
  textColor: string;
  fontSize:  number;
}

function resolveButtonStyle(box: ResolvedBox, theme: Theme, sd: SceneDefaults): ButtonStyle {
  const variant  = propStr(box, "variant") ?? "default";
  const sizeName = propStr(box, "size") ?? "md";
  const disabled = prop(box, "disabled") === true;
  const opacity  = disabled ? sd.button.disabledOpacity : 1;
  const fontMap: Record<string, number> = {
    xs: sd.button.fontXs, sm: sd.button.fontSm, md: sd.button.fontMd,
    lg: sd.button.fontLg, xl: sd.button.fontXl,
  };
  const fontSize = fontMap[sizeName] ?? theme.labelSize;

  switch (variant) {
    case "primary":
      return { fill: sd.button.primaryFill,   stroke: sd.button.primaryStroke,   opacity, textColor: sd.button.primaryText,   fontSize };
    case "secondary":
      return { fill: sd.button.secondaryFill, stroke: sd.button.secondaryStroke, opacity, textColor: sd.button.secondaryText, fontSize };
    case "danger":
      return { fill: sd.button.dangerFill,    stroke: sd.button.dangerStroke,    opacity, textColor: sd.button.dangerText,    fontSize };
    case "ghost":
      return { fill: sd.button.ghostFill,     stroke: sd.button.ghostStroke,     opacity, textColor: sd.button.ghostText,     fontSize };
    case "link":
      return { fill: "transparent",           stroke: sd.button.linkStroke,      opacity, textColor: sd.button.linkText,      fontSize };
    default:
      return { fill: sd.button.defaultFill,   stroke: sd.button.defaultStroke,   opacity, textColor: sd.button.defaultText,   fontSize };
  }
}

function buildTextItem(
  _box: ResolvedBox,
  text: string,
  theme: Theme,
  anchorX: number,
  anchorY: number,
  align:      "left" | "center" | "right",
  size:       number,
  bold:       boolean,
  maxW:       number,
  wrap?:      boolean,
  color?:     string,
  italic?:    boolean,
  truncate?:  boolean,
  fontWeight?: string,
): TextItem {
  let displayStr = text;
  if (truncate && !wrap && maxW > 0) {
    const charWidth = size * 0.60;
    const maxChars  = Math.max(1, Math.floor(maxW / charWidth));
    if (text.length > maxChars) {
      displayStr = text.slice(0, Math.max(1, maxChars - 1)) + "…";
    }
  }
  return new TextItem(
    anchorX, anchorY,
    displayStr, size,
    color ?? theme.textColor,
    align, bold, maxW, wrap,
    italic, fontWeight,
  );
}

function buildIcon(box: ResolvedBox, symbol: string, theme: Theme): IconItem {
  const size = Math.min(box.width, box.height, 18);
  return new IconItem(
    box.x + box.width  / 2,
    box.y + box.height / 2,
    size, symbol,
    theme.textColor,
  );
}

function buildSeparator(box: ResolvedBox, theme: Theme): LineItem {
  const orientation = propStr(box, "orientation");
  if (orientation === "vertical") {
    const mid = box.x + box.width / 2;
    return new LineItem(mid, box.y, mid, box.y + box.height, theme.defaultStroke, 1, "");
  }
  const mid = box.y + box.height / 2;
  return new LineItem(box.x, mid, box.x + box.width, mid, theme.defaultStroke, 1, "");
}

function buildInputCaret(box: ResolvedBox, theme: Theme, sd: SceneDefaults): LineItem {
  const cx = box.x + box.width - 10;
  const cy = box.y + box.height / 2;
  return new LineItem(cx, cy - 6, cx, cy + 6, theme.textColor + sd.input.caretAlpha, 1, "");
}

// ── Content rendering ─────────────────────────────────────────────────────────

function contentCalls(box: ResolvedBox, hints: RenderHints | undefined, theme: Theme, sd: SceneDefaults): DrawCall[] {
  const type = box.node.type.toLowerCase();
  const calls: DrawCall[] = [];

  // ── Text-family: size-aware rendering ───────────────────────────────────────
  if (["text", "label", "heading", "paragraph"].includes(type)) {
    const text = displayText(box);
    if (text) {
      const sizeKey  = type === "heading"
        ? prop(box, "level")
        : (propStr(box, "variant") ?? prop(box, "size"));
      const sizeSpec = resolveTextSize(sizeKey as string | number | undefined);

      const weightProp  = propStr(box, "weight");
      const bold        = weightProp === "bold" || weightProp === "semibold" ? true
                        : weightProp === "normal" || weightProp === "light" || weightProp === "medium" ? false
                        : sizeSpec.fontWeight === "bold";
      const fontWeight  = weightProp === "semibold" ? "600"
                        : weightProp === "medium"   ? "500"
                        : weightProp === "light"    ? "300"
                        : undefined;

      const italic   = prop(box, "italic")   === true;
      const truncate = prop(box, "truncate") === true;

      const alignProp = (propStr(box, "align") ?? "left") as "left" | "center" | "right";
      const textX     = alignProp === "center" ? box.x + box.width / 2
                      : alignProp === "right"  ? box.x + box.width - 6
                      :                          box.x + 6;

      if (type === "paragraph") {
        calls.push(buildTextItem(
          box, text, theme,
          textX, box.y + sizeSpec.fontSize + 4,
          alignProp, sizeSpec.fontSize, bold,
          box.width - 12, true,
          undefined, italic, false, fontWeight,
        ));
      } else {
        calls.push(buildTextItem(
          box, text, theme,
          textX, box.y + box.height / 2,
          alignProp, sizeSpec.fontSize, bold,
          box.width - 12, false,
          undefined, italic, truncate, fontWeight,
        ));
      }
    }
    return calls;
  }

  // ── Explicit text prop first ─────────────────────────────────────────────────
  const text = displayText(box);
  if (text) {
    const isPlaceholder = !propStr(box, "text") && !propStr(box, "label") && !propStr(box, "title");
    calls.push(buildTextItem(
      box, text, theme,
      box.x + box.width / 2, box.y + box.height / 2,
      "center", theme.labelSize, false,
      box.width - 8, false,
      isPlaceholder ? theme.textColor + "55" : theme.textColor,
    ));
    return calls;
  }

  // ── Icon hint ───────────────────────────────────────────────────────────────
  if (hints?.icon) {
    calls.push(buildIcon(box, hints.icon, theme));
    return calls;
  }

  // ── hasText hint: draw skeleton placeholder lines ───────────────────────────
  if (hints?.hasText) {
    const lineY1 = box.y + box.height * 0.42;
    const lineY2 = box.y + box.height * 0.62;
    const indent = 8;
    calls.push(new LineItem(
      box.x + indent, lineY1, box.x + box.width * 0.75, lineY1,
      theme.textColor + sd.hasText.line1Alpha, 1, "",
    ));
    if (box.height >= 32) {
      calls.push(new LineItem(
        box.x + indent, lineY2, box.x + box.width * 0.55, lineY2,
        theme.textColor + sd.hasText.line2Alpha, 1, "",
      ));
    }
  }

  return calls;
}

// ── Box → DrawCall[] ─────────────────────────────────────────────────────────

function boxToDrawCalls(box: ResolvedBox, theme: Theme, sd: SceneDefaults): DrawCall[] {
  const calls: DrawCall[] = [];
  const type = box.node.type.toLowerCase();
  const ctrl = getControl(type);
  const hints = ctrl?.renderHints;

  if (box.width <= 0 || box.height <= 0) return calls;

  // Separators / dividers → single line, no rect
  if (type === "separator" || type === "divider") {
    calls.push(buildSeparator(box, theme));
    return calls;
  }

  // ── Button ──────────────────────────────────────────────────────────────────
  if (type === "button") {
    const btnStyle = resolveButtonStyle(box, theme, sd);
    calls.push(new RectItem(
      box.x, box.y, box.width, box.height,
      btnStyle.fill, btnStyle.stroke, hints?.radius ?? 4, btnStyle.opacity,
    ));
    const btnText = displayText(box);
    if (btnText) {
      calls.push(buildTextItem(
        box, btnText, theme,
        box.x + box.width / 2, box.y + box.height / 2,
        "center", btnStyle.fontSize, false,
        box.width - 8, false,
        btnStyle.textColor,
      ));
    }
    if (prop(box, "loading") === true) {
      const r = Math.min(8, box.height / 4);
      calls.push(new CircleItem(
        box.x + 16, box.y + box.height / 2, r,
        "transparent", btnStyle.textColor,
      ));
    }
    return calls;
  }

  // ── Checkbox ────────────────────────────────────────────────────────────────
  if (type === "checkbox") {
    const checked       = prop(box, "checked") === true;
    const indeterminate = prop(box, "indeterminate") === true;
    const disabled      = prop(box, "disabled") === true;
    const color         = disabled ? theme.textColor + "55" : theme.textColor;
    const boxSz         = sd.checkbox.indicatorSize;
    const indX          = box.x;
    const indY          = box.y + (box.height - boxSz) / 2;
    const midY          = box.y + box.height / 2;
    const labelX        = indX + boxSz + sd.checkbox.labelGap;

    calls.push(new RectItem(
      indX, indY, boxSz, boxSz,
      checked ? sd.checkbox.checkedFill : "transparent",
      disabled ? sd.checkbox.disabledStroke : sd.checkbox.stroke,
      sd.checkbox.radius, 1,
    ));
    if (checked) {
      calls.push(new LineItem(
        indX + 2,           indY + boxSz * 0.52,
        indX + boxSz * 0.4, indY + boxSz - 3,
        sd.checkbox.checkColor, 1.5, "",
      ));
      calls.push(new LineItem(
        indX + boxSz * 0.4, indY + boxSz - 3,
        indX + boxSz - 2,   indY + 3,
        sd.checkbox.checkColor, 1.5, "",
      ));
    } else if (indeterminate) {
      calls.push(new LineItem(
        indX + 3, midY, indX + boxSz - 3, midY,
        sd.checkbox.stroke, 2, "",
      ));
    }
    const label = displayText(box);
    if (label) {
      calls.push(buildTextItem(
        box, label, theme,
        labelX, midY,
        "left", theme.labelSize, false,
        box.width - (labelX - box.x),
        false, color,
      ));
    }
    return calls;
  }

  // ── Drawer ──────────────────────────────────────────────────────────────────
  if (type === "drawer") {
    const title = propStr(box, "title");
    const hh = sd.drawer.headerHeight;

    calls.push(new RectItem(
      box.x, box.y, box.width, box.height,
      hints?.fill ?? sd.drawer.fill, hints?.stroke ?? sd.drawer.stroke,
      hints?.radius ?? 0, 1,
    ));
    if (title) {
      calls.push(new RectItem(
        box.x, box.y, box.width, hh,
        sd.drawer.headerFill, hints?.stroke ?? sd.drawer.stroke, 0, 1,
      ));
      calls.push(new LineItem(
        box.x, box.y + hh, box.x + box.width, box.y + hh,
        sd.drawer.headerBorder, 1, "",
      ));
      calls.push(buildTextItem(
        box, title, theme,
        box.x + 16, box.y + hh / 2,
        "left", theme.labelSize + 1, true,
        box.width - 48, false, theme.textColor,
      ));
      calls.push(buildTextItem(
        box, "×", theme,
        box.x + box.width - 20, box.y + hh / 2,
        "center", theme.labelSize + 3, false,
        20, false, theme.textColor + sd.drawer.closeAlpha,
      ));
    }
    return calls;
  }

  // ── Modal ───────────────────────────────────────────────────────────────────
  if (type === "modal") {
    const title    = propStr(box, "title");
    const closable = prop(box, "closable") !== false;
    const hh = sd.modal.headerHeight;
    const radius = hints?.radius ?? sd.modal.radius;

    calls.push(new RectItem(
      box.x, box.y, box.width, box.height,
      hints?.fill ?? sd.modal.fill, hints?.stroke ?? sd.modal.stroke,
      radius, hints?.opacity ?? sd.modal.opacity,
    ));
    if (title) {
      calls.push(new RectItem(
        box.x, box.y, box.width, hh,
        sd.modal.headerFill, hints?.stroke ?? sd.modal.stroke, radius, 1,
      ));
      calls.push(new RectItem(
        box.x, box.y + hh / 2, box.width, hh / 2,
        sd.modal.headerFill, "none", 0, 1,
      ));
      calls.push(new LineItem(
        box.x, box.y + hh, box.x + box.width, box.y + hh,
        sd.modal.headerBorder, 1, "",
      ));
      calls.push(buildTextItem(
        box, title, theme,
        box.x + 20, box.y + hh / 2,
        "left", theme.labelSize + 1, true,
        box.width - (closable ? 60 : 40), false, theme.textColor,
      ));
      if (closable) {
        calls.push(buildTextItem(
          box, "×", theme,
          box.x + box.width - 20, box.y + hh / 2,
          "center", theme.labelSize + 3, false,
          20, false, theme.textColor + sd.modal.closeAlpha,
        ));
      }
    }
    return calls;
  }

  // ── Card ────────────────────────────────────────────────────────────────────
  if (type === "card") {
    const title = propStr(box, "title");
    const hh = sd.card.headerHeight;
    const radius = hints?.radius ?? sd.card.radius;
    calls.push(new RectItem(
      box.x, box.y, box.width, box.height,
      hints?.fill ?? sd.card.fill, hints?.stroke ?? sd.card.stroke,
      radius, 1,
    ));
    if (title) {
      calls.push(new RectItem(
        box.x, box.y, box.width, hh,
        sd.card.headerFill, hints?.stroke ?? sd.card.stroke, radius, 1,
      ));
      calls.push(new RectItem(
        box.x, box.y + hh / 2, box.width, hh / 2,
        sd.card.headerFill, "none", 0, 1,
      ));
      calls.push(new LineItem(
        box.x, box.y + hh, box.x + box.width, box.y + hh,
        sd.card.headerBorder, 1, "",
      ));
      calls.push(buildTextItem(
        box, title, theme,
        box.x + 16, box.y + hh / 2,
        "left", theme.labelSize + 1, true,
        box.width - 32, false, theme.textColor,
      ));
    }
    return calls;
  }

  // ── Tablerow ─────────────────────────────────────────────────────────────────
  if (type === "tablerow") {
    const selected = prop(box, "selected") === true;
    const disabled = prop(box, "disabled") === true;
    const tr = sd.tablerow;

    calls.push(new RectItem(
      box.x, box.y, box.width, box.height,
      selected ? tr.selectedFill : "transparent",
      "none", 0, disabled ? tr.disabledOpacity : 1,
    ));
    if (selected) {
      calls.push(new RectItem(
        box.x, box.y, tr.selectedAccentWidth, box.height,
        tr.selectedAccent, "none", 0, 1,
      ));
    }
    for (let i = 1; i < 4; i++) {
      const lx = box.x + box.width * i * 0.25;
      calls.push(new LineItem(
        lx, box.y + 4, lx, box.y + box.height - 4,
        theme.defaultStroke + tr.dividerAlpha, 1, "",
      ));
    }
    for (let i = 0; i < 4; i++) {
      const cellX = box.x + box.width * i * 0.25 + 12;
      const cellW = box.width * 0.25 - 24;
      const lineW = cellW * [0.85, 0.6, 0.75, 0.5][i];
      calls.push(new RectItem(
        cellX, box.y + box.height / 2 - 5,
        lineW, 10,
        selected ? tr.selectedSkeletonFill : theme.defaultStroke + tr.borderAlpha,
        "none", tr.cellSkeletonRadius,
        disabled ? tr.disabledOpacity : tr.cellSkeletonOpacity,
      ));
    }
    calls.push(new LineItem(
      box.x, box.y + box.height,
      box.x + box.width, box.y + box.height,
      theme.defaultStroke + tr.borderAlpha, 1, "",
    ));
    return calls;
  }

  // ── Listitem ─────────────────────────────────────────────────────────────────
  if (type === "listitem") {
    const text     = propStr(box, "text")     ?? propStr(box, "label") ?? "";
    const subtitle = propStr(box, "subtitle");
    const iconName = propStr(box, "icon");
    const disabled = prop(box, "disabled") === true;
    const opacity  = disabled ? 0.4 : 1;
    const li = sd.listitem;

    const ICON_SYMBOLS: Record<string, string> = {
      user: "◉", plus: "+", star: "★", check: "✓", edit: "✎",
      delete: "✗", settings: "⚙", home: "⌂", search: "⌕",
    };

    const hasIcon  = !!iconName;
    const iconSize = li.iconSize;
    const iconX    = box.x + 12;
    const textX    = box.x + (hasIcon ? iconX - box.x + iconSize + li.iconTextGap : 12);
    const cy       = box.y + box.height / 2;

    calls.push(new RectItem(box.x, box.y, box.width, box.height, "transparent", "none", 0, opacity));
    calls.push(new LineItem(
      box.x, box.y + box.height, box.x + box.width, box.y + box.height,
      theme.defaultStroke + li.separatorAlpha, 1, "",
    ));

    if (hasIcon) {
      const symbol = ICON_SYMBOLS[iconName!.toLowerCase()] ?? "◉";
      calls.push(new CircleItem(iconX + iconSize / 2, cy, iconSize / 2, li.iconFill, li.iconStroke));
      calls.push(buildTextItem(
        box, symbol, theme,
        iconX + iconSize / 2, cy,
        "center", li.iconSymbolSize, false, iconSize, false, theme.textColor,
      ));
    }

    if (subtitle) {
      calls.push(buildTextItem(
        box, text, theme, textX, cy - li.twoLineOffset,
        "left", theme.labelSize, false, box.width - (textX - box.x) - 8, false, theme.textColor,
      ));
      calls.push(buildTextItem(
        box, subtitle, theme, textX, cy + li.twoLineOffset + 1,
        "left", theme.labelSize - 1, false, box.width - (textX - box.x) - 8, false,
        theme.textColor + li.subtitleAlpha,
      ));
    } else {
      calls.push(buildTextItem(
        box, text, theme, textX, cy,
        "left", theme.labelSize, false, box.width - (textX - box.x) - 8, false, theme.textColor,
      ));
    }
    return calls;
  }

  // ── Pagination ───────────────────────────────────────────────────────────────
  if (type === "pagination") {
    const page      = propNum(box, "page",     1);
    const total     = propNum(box, "total",    10);
    const pageSize  = propNum(box, "pageSize", 10) || 10;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const pg = sd.pagination;
    const btnW = pg.buttonWidth, btnH = box.height, gap = pg.buttonGap;

    const tokens: Array<number | "…"> = [];
    const add = (n: number) => { if (!tokens.includes(n)) tokens.push(n); };
    add(1);
    if (page - 2 > 2) tokens.push("…");
    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) add(p);
    if (page + 2 < totalPages - 1) tokens.push("…");
    if (totalPages > 1) add(totalPages);

    const totalW = btnW + (btnW + gap) * tokens.length + gap + btnW;
    let cx = box.x + (box.width - totalW) / 2;
    const cy = box.y + btnH / 2;

    const drawBtn = (label: string, isFilled: boolean, isMuted: boolean) => {
      calls.push(new RectItem(
        cx, box.y, btnW, btnH,
        isFilled ? pg.activeFill : "transparent",
        isMuted ? theme.defaultStroke + "44" : theme.defaultStroke,
        pg.radius, isMuted ? pg.mutedOpacity : 1,
      ));
      calls.push(buildTextItem(
        box, label, theme, cx + btnW / 2, cy,
        "center", theme.labelSize, isFilled, btnW - 4, false,
        isFilled ? pg.activeText : isMuted ? theme.textColor + "55" : theme.textColor,
      ));
      cx += btnW + gap;
    };

    drawBtn("‹", false, page <= 1);
    for (const token of tokens) {
      if (token === "…") drawBtn("…", false, true);
      else drawBtn(String(token), token === page, false);
    }
    drawBtn("›", false, page >= totalPages);

    return calls;
  }

  // ── Tabbar ──────────────────────────────────────────────────────────────────
  if (type === "tabbar") {
    calls.push(new RectItem(
      box.x, box.y, box.width, box.height,
      hints?.fill ?? sd.tabbar.fill, hints?.stroke ?? sd.tabbar.stroke, 0, 1,
    ));
    calls.push(new LineItem(
      box.x, box.y + box.height, box.x + box.width, box.y + box.height,
      sd.tabbar.borderColor, 1, "",
    ));
    return calls;
  }

  // ── Tab ─────────────────────────────────────────────────────────────────────
  if (type === "tab") {
    const active   = prop(box, "active")   === true;
    const disabled = prop(box, "disabled") === true;
    const label    = displayText(box);
    const opacity  = disabled ? 0.4 : 1;
    const tb = sd.tab;

    if (active) {
      calls.push(new RectItem(
        box.x, box.y, box.width, box.height,
        tb.activeFill, "none", hints?.radius ?? tb.radius, opacity,
      ));
      calls.push(new LineItem(
        box.x + 4, box.y + box.height,
        box.x + box.width - 4, box.y + box.height,
        tb.activeAccent, tb.activeAccentWidth, "",
      ));
    } else {
      calls.push(new RectItem(
        box.x, box.y, box.width, box.height,
        "transparent", "none", 0, opacity,
      ));
    }
    if (label) {
      calls.push(buildTextItem(
        box, label, theme,
        box.x + box.width / 2, box.y + box.height / 2,
        "center", theme.labelSize, active, box.width - 8, false,
        active ? theme.textColor : theme.textColor + tb.inactiveAlpha,
      ));
    }
    return calls;
  }

  // ── Navbar ──────────────────────────────────────────────────────────────────
  if (type === "navbar") {
    const title = propStr(box, "title") ?? propStr(box, "text") ?? "";

    calls.push(new RectItem(
      box.x, box.y, box.width, box.height,
      hints?.fill ?? sd.navbar.fill, hints?.stroke ?? sd.navbar.stroke, 0, 1,
    ));
    calls.push(new LineItem(
      box.x, box.y + box.height, box.x + box.width, box.y + box.height,
      sd.navbar.borderColor, 1, "",
    ));
    if (title) {
      calls.push(buildTextItem(
        box, title, theme,
        box.x + 16, box.y + box.height / 2,
        "left", theme.labelSize + 1, true,
        box.width / 3, false, theme.textColor,
      ));
    }
    return calls;
  }

  // ── Image ───────────────────────────────────────────────────────────────────
  if (type === "image") {
    const fit    = propStr(box, "fit") ?? "fill";
    const bg     = hints?.fill   ?? sd.image.fill;
    const border = hints?.stroke ?? sd.image.stroke;
    const radius = hints?.radius ?? sd.image.radius;
    const imgColor = sd.image.innerColor;

    calls.push(new RectItem(box.x, box.y, box.width, box.height, bg, border, radius, 1));

    const cx = box.x + box.width  / 2;
    const cy = box.y + box.height / 2;

    if (fit === "contain" || fit === "scale-down") {
      const innerW = box.width  * 0.7;
      const innerH = innerW * 0.75;
      const ix = cx - innerW / 2;
      const iy = cy - innerH / 2;
      calls.push(new RectItem(ix, iy, innerW, innerH, imgColor, border + "88", 2, 1));
      calls.push(new LineItem(ix, iy, ix + innerW, iy + innerH, border + "40", 1, ""));
      calls.push(new LineItem(ix + innerW, iy, ix, iy + innerH, border + "40", 1, ""));
    } else if (fit === "cover") {
      calls.push(new RectItem(box.x + 2, box.y + 2, box.width - 4, box.height - 4, imgColor, "none", radius - 1, 1));
      calls.push(new LineItem(box.x, box.y + 2, box.x, box.y + box.height - 2, border, 2, "4 3"));
      calls.push(new LineItem(box.x + box.width, box.y + 2, box.x + box.width, box.y + box.height - 2, border, 2, "4 3"));
    } else if (fit === "none") {
      const innerW = box.width  * 0.45;
      const innerH = box.height * 0.45;
      calls.push(new RectItem(cx - innerW / 2, cy - innerH / 2, innerW, innerH, imgColor, border + "88", 2, 1));
    } else {
      // fill (default)
      calls.push(new RectItem(box.x + 2, box.y + 2, box.width - 4, box.height - 4, imgColor, "none", radius - 1, 1));
      calls.push(new LineItem(box.x, box.y, box.x + box.width, box.y + box.height, border + "50", 1, ""));
      calls.push(new LineItem(box.x + box.width, box.y, box.x, box.y + box.height, border + "50", 1, ""));
    }

    calls.push(buildTextItem(
      box, `fit: ${fit}`, theme,
      cx, box.y + box.height - 7,
      "center", theme.labelSize - 1, false,
      box.width - 8, false,
      theme.textColor + "99",
    ));
    return calls;
  }

  // ── Icon ────────────────────────────────────────────────────────────────────
  if (type === "icon") {
    const ICON_SYMBOLS: Record<string, string> = {
      star:    "★", heart:   "♥", check:   "✓", alert:   "⚠",
      info:    "ℹ", close:   "✕", search:  "⌕", home:    "⌂",
      user:    "◉", settings:"⚙", edit:    "✎", delete:  "✗",
      arrow:   "→", back:    "←", up:      "↑", down:    "↓",
      plus:    "+", minus:   "−", menu:    "≡", bell:    "🔔",
    };
    const name     = propStr(box, "name") ?? "";
    const symbol   = ICON_SYMBOLS[name.toLowerCase()] ?? hints?.icon ?? "★";
    const iconSize = Math.min(box.width, box.height);
    const color    = propStr(box, "color") ?? theme.textColor;

    calls.push(new IconItem(
      box.x + box.width  / 2,
      box.y + box.height / 2,
      iconSize, symbol, color,
    ));
    return calls;
  }

  // ── Select / Dropdown ──��────────────────────────────────────────────────────
  if (type === "select" || type === "dropdown") {
    const disabled    = prop(box, "disabled") === true;
    const required    = prop(box, "required") === true;
    const value       = propStr(box, "value");
    const placeholder = propStr(box, "placeholder") ?? "Select…";
    const opacity     = disabled ? 0.4 : 1;
    const displayVal  = value ?? placeholder;
    const isPlaceholder = !value;
    const sl = sd.select;

    calls.push(new RectItem(
      box.x, box.y, box.width, box.height,
      hints?.fill ?? sl.fill, hints?.stroke ?? sl.stroke, hints?.radius ?? sl.radius, opacity,
    ));
    calls.push(buildTextItem(
      box, displayVal, theme,
      box.x + 10, box.y + box.height / 2,
      "left", theme.labelSize, false, box.width - 30, false,
      isPlaceholder ? theme.textColor + sl.placeholderAlpha : theme.textColor,
    ));
    calls.push(buildTextItem(
      box, "▾", theme,
      box.x + box.width - 14, box.y + box.height / 2,
      "center", theme.labelSize + 1, false, 16, false, theme.textColor + sl.chevronAlpha,
    ));
    if (required) {
      calls.push(buildTextItem(
        box, "*", theme,
        box.x + box.width - 6, box.y + 6,
        "center", theme.labelSize, false, 10, false, sl.requiredColor,
      ));
    }
    return calls;
  }

  // ── Alert / Toast ────────────────────────────────────────────────��───────────
  if (type === "alert" || type === "toast") {
    const variant  = propStr(box, "variant") ?? "default";
    const closable = prop(box, "closable") === true;
    const al = sd.alert;

    const ALERT_STYLES: Record<string, { fill: string; stroke: string; accent: string }> = {
      default: { fill: al.defaultFill, stroke: al.defaultStroke, accent: al.defaultAccent },
      primary: { fill: al.primaryFill, stroke: al.primaryStroke, accent: al.primaryAccent },
      success: { fill: al.successFill, stroke: al.successStroke, accent: al.successAccent },
      warning: { fill: al.warningFill, stroke: al.warningStroke, accent: al.warningAccent },
      danger:  { fill: al.dangerFill,  stroke: al.dangerStroke,  accent: al.dangerAccent  },
    };
    const style   = ALERT_STYLES[variant] ?? ALERT_STYLES.default;
    const accentW = al.accentWidth;

    calls.push(new RectItem(
      box.x, box.y, box.width, box.height,
      style.fill, style.stroke, hints?.radius ?? 4, 1,
    ));
    calls.push(new RectItem(
      box.x, box.y, accentW, box.height,
      style.accent, "none", 0, 1,
    ));
    const msg = displayText(box);
    if (msg) {
      const textX = box.x + accentW + 12;
      const maxW  = box.width - accentW - 12 - (closable ? 32 : 8);
      calls.push(buildTextItem(
        box, msg, theme,
        textX, box.y + box.height / 2,
        "left", theme.labelSize, false,
        maxW, false, theme.textColor,
      ));
    }
    if (closable) {
      calls.push(buildTextItem(
        box, "×", theme,
        box.x + box.width - 16, box.y + box.height / 2,
        "center", theme.labelSize + 2, false,
        20, false, style.accent,
      ));
    }
    return calls;
  }

  // ── Skeleton ────────────────────────────────────────────────────────────────
  if (type === "skeleton") {
    const lines  = propNum(box, "lines", 1);
    const sk     = sd.skeleton;
    const lineFill = hints?.fill ?? sk.fill;

    for (let i = 0; i < lines; i++) {
      const lineY = box.y + i * sk.lineSpacing;
      const lineW = i === lines - 1 && lines > 1 ? box.width * 0.6 : box.width;
      calls.push(new RectItem(box.x, lineY, lineW, sk.lineHeight, lineFill, "none", sk.radius, sk.opacity));
    }
    return calls;
  }

  // ── Badge ───────────────────────────────────────────────────────────────────
  if (type === "badge") {
    const variant = propStr(box, "variant") ?? "default";
    const isDot   = prop(box, "dot") === true;
    const bg = sd.badge;

    const BADGE_COLORS: Record<string, string> = {
      default: bg.defaultFill, primary: bg.primaryFill,
      success: bg.successFill, warning: bg.warningFill, danger: bg.dangerFill,
    };
    const fill = BADGE_COLORS[variant] ?? bg.defaultFill;

    if (isDot) {
      const r  = Math.min(box.width, box.height) / 2;
      const cx = box.x + box.width  / 2;
      const cy = box.y + box.height / 2;
      calls.push(new CircleItem(cx, cy, r, fill, theme.defaultStroke));
    } else {
      calls.push(new RectItem(box.x, box.y, box.width, box.height, fill, theme.defaultStroke, box.height / 2, 1));
      const label = displayText(box);
      if (label) {
        calls.push(buildTextItem(
          box, label, theme,
          box.x + box.width / 2, box.y + box.height / 2,
          "center", theme.labelSize - 1, false, box.width - 8, false, bg.textColor,
        ));
      }
    }
    return calls;
  }

  // ── Avatar ──────────────────────────────────────────────────────────────────
  if (type === "avatar") {
    const name     = propStr(box, "name") ?? propStr(box, "text") ?? "?";
    const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");

    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
    const bgColor = sd.avatar.colors[hash % sd.avatar.colors.length];

    const r  = Math.min(box.width, box.height) / 2;
    const cx = box.x + box.width  / 2;
    const cy = box.y + box.height / 2;
    const fontSize = Math.max(9, Math.round(r * 0.7));

    calls.push(new CircleItem(cx, cy, r, bgColor, "none"));
    calls.push(buildTextItem(
      box, initials, theme, cx, cy,
      "center", fontSize, true, box.width, false, sd.avatar.textColor,
    ));
    return calls;
  }

  // ── Progress ────────────────────────────────────────────────────────────────
  if (type === "progress") {
    const value         = propNum(box, "value", 0);
    const max           = propNum(box, "max", 100) || 100;
    const indeterminate = prop(box, "indeterminate") === true;
    const pct           = Math.min(1, Math.max(0, value / max));
    const radius        = hints?.radius ?? sd.progress.radius;
    const pr = sd.progress;

    calls.push(new RectItem(box.x, box.y, box.width, box.height, pr.trackFill, pr.trackStroke, radius, 1));
    if (indeterminate) {
      calls.push(new RectItem(box.x, box.y, box.width * 0.4, box.height, hints?.fill ?? pr.fill, "none", radius, 1, "6 4"));
    } else if (pct > 0) {
      calls.push(new RectItem(box.x, box.y, box.width * pct, box.height, hints?.fill ?? pr.fill, "none", radius, 1));
    }
    return calls;
  }

  // ── Toggle / Switch ──────────────────────────────────────────────────────────
  if (type === "toggle" || type === "switch") {
    const checked  = prop(box, "checked") === true;
    const disabled = prop(box, "disabled") === true;
    const tg = sd.toggle;
    const opacity    = disabled ? tg.disabledOpacity : 1;
    const trackFill  = checked ? tg.checkedTrack  : tg.uncheckedTrack;
    const trackStroke = checked ? tg.checkedStroke : tg.uncheckedStroke;
    const thumbR  = box.height / 2 - 2;
    const thumbCY = box.y + box.height / 2;
    const thumbCX = checked ? box.x + box.width - thumbR - 3 : box.x + thumbR + 3;

    calls.push(new RectItem(box.x, box.y, box.width, box.height, trackFill, trackStroke, box.height / 2, opacity));
    calls.push(new CircleItem(thumbCX, thumbCY, thumbR, tg.thumbColor, "none"));
    return calls;
  }

  // ── Radio ───────────────────────────────────────────────────────────────────
  if (type === "radio") {
    const checked  = prop(box, "checked") === true;
    const disabled = prop(box, "disabled") === true;
    const color    = disabled ? theme.textColor + "55" : theme.textColor;
    const rd = sd.radio;
    const r        = rd.radius;
    const cx       = box.x + 3 + r;
    const cy       = box.y + box.height / 2;
    const labelX   = cx + r + 7;

    calls.push(new CircleItem(cx, cy, r, "transparent", disabled ? rd.stroke + rd.disabledAlpha : rd.stroke));
    if (checked) {
      calls.push(new CircleItem(cx, cy, r - 3, rd.checkedFill, rd.checkedFill));
    }
    const label = displayText(box);
    if (label) {
      calls.push(buildTextItem(
        box, label, theme, labelX, cy,
        "left", theme.labelSize, false, box.width - (labelX - box.x), false, color,
      ));
    }
    return calls;
  }

  // ── Breadcrumb ───────────────────────────────────────────────────────────────
  if (type === "breadcrumb") {
    const label   = propStr(box, "text") ?? "";
    const opacity = prop(box, "disabled") === true ? 0.45 : 1;
    if (label) {
      const t = buildTextItem(
        box, label, theme,
        box.x + 4, box.y + box.height / 2,
        "left", theme.labelSize, false, box.width - 8, false, sd.breadcrumb.textColor,
      );
      calls.push(Object.assign(t, { opacity }));
    }
    return calls;
  }

  // ── Tooltip ──────────────────────────────────────────────────────────────────
  if (type === "tooltip") {
    calls.push(new RectItem(box.x, box.y, box.width, box.height, sd.tooltip.fill, sd.tooltip.stroke, 4, 1));
    const label = propStr(box, "text") ?? "";
    if (label) {
      calls.push(buildTextItem(
        box, label, theme,
        box.x + box.width / 2, box.y + box.height / 2,
        "center", theme.labelSize, false, box.width - 12, false, sd.tooltip.textColor,
      ));
    }
    return calls;
  }

  // ── Slider track + thumb (standalone — no background rect) ──────────────────
  if (type === "slider") {
    const pct    = propNum(box, "value", 50) / 100;
    const thumbX = box.x + box.width * pct;
    const midY   = box.y + box.height / 2;
    const sl     = sd.slider;
    // Track background (full width)
    calls.push(new LineItem(box.x + 4, midY, box.x + box.width - 4, midY, sl.trackStroke, sl.trackWidth, ""));
    // Track fill (filled portion)
    if (pct > 0) {
      calls.push(new LineItem(box.x + 4, midY, thumbX, midY, sl.trackFill, sl.trackWidth, ""));
    }
    // Thumb
    calls.push(new CircleItem(thumbX, midY, sl.thumbRadius, sl.thumbFill, sl.thumbStroke));
    return calls;
  }

  // ── Default: rect + content ──────────────────────────────────────────────────
  calls.push(buildRect(box, hints, theme));
  calls.push(...contentCalls(box, hints, theme, sd));

  // Input caret
  if (["input", "textfield", "textarea", "password", "search"].includes(type)) {
    calls.push(buildInputCaret(box, theme, sd));
  }

  // Spinner ring
  if (type === "spinner") {
    const r = Math.min(box.width, box.height) / 2 - 2;
    calls.push(new CircleItem(
      box.x + box.width / 2, box.y + box.height / 2, r,
      "transparent", hints?.stroke ?? sd.spinner.stroke,
    ));
  }

  return calls;
}

// ── Public: buildScene ────────────────────────────────────────────────────────

/**
 * Converts a `ResolvedScreen` into a flat `Scene` of `DrawCall`s.
 * Boxes are sorted back-to-front (lowest depth first).
 */
const OVERLAY_TYPES = new Set(["modal", "drawer"]);

type WrafNode = ResolvedBox["node"];

function collectDescendantNodes(node: WrafNode, out: Set<WrafNode>): void {
  for (const child of node.children) {
    out.add(child);
    collectDescendantNodes(child, out);
  }
}

export function buildScene(screen: ResolvedScreen, theme: Theme): Scene {
  const sd = applySceneDefaults();

  // Collect all nodes that are descendants of an overlay (modal/drawer)
  const overlayDescendants = new Set<WrafNode>();
  for (const box of screen.boxes) {
    if (OVERLAY_TYPES.has(box.node.type.toLowerCase())) {
      collectDescendantNodes(box.node, overlayDescendants);
    }
  }

  // Back-to-front by depth; overlay roots + their descendants always on top
  const isOverlayGroup = (box: ResolvedBox) =>
    OVERLAY_TYPES.has(box.node.type.toLowerCase()) || overlayDescendants.has(box.node);

  const sorted = [...screen.boxes].sort((a, b) => {
    const aOverlay = isOverlayGroup(a);
    const bOverlay = isOverlayGroup(b);
    if (aOverlay !== bOverlay) return aOverlay ? 1 : -1;
    return a.depth - b.depth;
  });
  const calls: DrawCall[] = sorted.flatMap(box => boxToDrawCalls(box, theme, sd));

  return {
    width:  screen.width,
    height: screen.height,
    screen,
    calls,
  };
}

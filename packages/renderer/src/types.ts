import type { ResolvedBox, ResolvedScreen } from "@wrafjs/layout";

// ── SceneItem — common base for every element in the scene ────────────────────

export abstract class SceneItem {
  abstract readonly kind: string;

  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;

  constructor(x: number, y: number, width: number, height: number) {
    this.x      = x;
    this.y      = y;
    this.width  = width;
    this.height = height;
  }
}

// ── Concrete scene items ──────────────────────────────────────────────────────

export class RectItem extends SceneItem {
  readonly kind = "rect" as const;

  constructor(
    x: number, y: number, width: number, height: number,
    readonly fill:    string,
    readonly stroke:  string,
    readonly radius:  number,
    readonly opacity: number,
    readonly dash?:   string,
  ) { super(x, y, width, height); }
}

export class TextItem extends SceneItem {
  readonly kind = "text" as const;

  readonly anchorX: number;
  readonly anchorY: number;

  constructor(
    anchorX: number,
    anchorY: number,
    readonly text:  string,
    readonly size:  number,
    readonly color: string,
    readonly align: "left" | "center" | "right",
    readonly bold:  boolean,
    readonly maxW?: number,
    readonly wrap?: boolean,
    readonly italic?: boolean,
    readonly fontWeight?: string,
  ) {
    const w = maxW ?? 0;
    const h = size * 1.4;
    const left = align === "center" ? anchorX - w / 2
               : align === "right"  ? anchorX - w
               :                      anchorX;
    const top  = wrap ? anchorY - size
               :        anchorY - h / 2;
    super(left, top, w, h);
    this.anchorX = anchorX;
    this.anchorY = anchorY;
  }
}

export class LineItem extends SceneItem {
  readonly kind = "line" as const;

  constructor(
    readonly x1: number,
    readonly y1: number,
    readonly x2: number,
    readonly y2: number,
    readonly stroke:      string,
    readonly strokeWidth: number,
    readonly dasharray:   string,
  ) {
    super(
      Math.min(x1, x2),
      Math.min(y1, y2),
      Math.abs(x2 - x1),
      Math.abs(y2 - y1),
    );
  }
}

export class CircleItem extends SceneItem {
  readonly kind = "circle" as const;

  constructor(
    readonly cx: number,
    readonly cy: number,
    readonly r:  number,
    readonly fill:   string,
    readonly stroke: string,
  ) { super(cx - r, cy - r, r * 2, r * 2); }
}

export class IconItem extends SceneItem {
  readonly kind = "icon" as const;

  constructor(
    readonly cx:       number,
    readonly cy:       number,
    readonly iconSize: number,
    readonly symbol:   string,
    readonly color:    string,
  ) { super(cx - iconSize / 2, cy - iconSize / 2, iconSize, iconSize); }
}

export class GroupItem extends SceneItem {
  readonly kind = "group" as const;

  constructor(
    readonly id:       string,
    readonly box:      ResolvedBox,
    readonly children: DrawCall[],
  ) { super(box.x, box.y, box.width, box.height); }
}

// ── DrawCall ──────────────────────────────────────────────────────────────────

export type DrawCall =
  | RectItem
  | TextItem
  | LineItem
  | CircleItem
  | IconItem
  | GroupItem;

// ── Scene ─────────────────────────────────────────────────────────────────────

export interface Scene {
  width:   number;
  height:  number;
  screen:  ResolvedScreen;
  calls:   DrawCall[];
}

// ── Theme ─────────────────────────────────────────────────────────────────────

/** Production only supports the sketch (hand-drawn) theme. */
export type ThemeId = "sketch";

export interface Theme {
  id:            ThemeId;
  canvasBg:      string;
  defaultStroke: string;
  defaultFill:   string;
  textColor:     string;
  labelSize:     number;
  typeSize:      number;
  showTypeLabels: boolean;
  /** CSS font-family stack used for all text in the rendered SVG. */
  fontFamily:    string;
}

/** Fixed light-mode sketch theme — not user-configurable. */
export const SKETCH_THEME: Theme = {
  id:             "sketch",
  canvasBg:       "#faf8f4",
  defaultStroke:  "#2a2a2a",
  defaultFill:    "#f4f0e8",
  textColor:      "#1a1a1a",
  labelSize:       12,
  typeSize:        10,
  showTypeLabels: false,
  fontFamily:     "'Patrick Hand', cursive",
};

// ── Painter interface ─────────────────────────────────────────────────────────

export interface Painter {
  readonly theme: Theme;
  render(scene: Scene, svg: SVGSVGElement): void;
}

// ── Render options ────────────────────────────────────────────────────────────

export interface RenderOptions {
  scale?: number;
}

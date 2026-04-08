// ── Types ─────────────────────────────────────────────────────────────────────
export type {
  DrawCall,
  Scene, Painter, RenderOptions, Theme, ThemeId,
} from "./types.js";
export {
  SceneItem,
  RectItem, TextItem, LineItem, CircleItem, IconItem, GroupItem,
  SKETCH_THEME,
} from "./types.js";

// ── Scene builder ─────────────────────────────────────────────────────────────
export { buildScene } from "./scene-builder.js";

// ── Scene defaults ────────────────────────────────────────────────────────────
export type { SceneDefaults } from "./scene-defaults.js";
export { DEFAULT_SCENE_DEFAULTS } from "./scene-defaults.js";

// ── Painter ───────────────────────────────────────────────────────────────────
export { SketchPainter } from "./painters/sketch.js";

// ── Zoom ──────────────────────────────────────────────────────────────────────
export type { ZoomState } from "./zoom.js";
export { ZoomController } from "./zoom.js";

// ── Convenience ───────────────────────────────────────────────────────────────

import type { ResolvedScreen } from "@wrafjs/layout";
import { SKETCH_THEME } from "./types.js";
import { buildScene } from "./scene-builder.js";
import { SketchPainter } from "./painters/sketch.js";
import type { Painter } from "./types.js";

/** Creates a ready SketchPainter (async — loads Rough.js on demand). */
export function createPainter(): Promise<SketchPainter> {
  return SketchPainter.create(SKETCH_THEME);
}

/**
 * All-in-one: build a scene from a `ResolvedScreen` and render it into an
 * existing `<svg>` element using the given painter.
 */
export function renderScreen(
  screen:  ResolvedScreen,
  svg:     SVGSVGElement,
  painter: Painter,
): void {
  const scene = buildScene(screen, painter.theme);
  painter.render(scene, svg);
}

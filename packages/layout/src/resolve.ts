import type { WrafFile } from "@wrafjs/parser";
import { collectBoxes } from "./collect.js";
import { type LayoutOptions, type ResolvedScreen, applyLayoutOptions } from "./types.js";
import { numProp, hasProp, propValue } from "./helpers.js";

/**
 * Full pipeline for the single-file model: resolves coordinates and returns
 * a flat list of positioned boxes plus the screen dimensions.
 *
 * Screen dimensions respect growMode:
 *  "vertical"   (default) — height derived from bounding box when not explicit
 *  "horizontal"            — width derived from bounding box when not explicit
 *  "none"                  — only explicit props used
 */
export function resolveLayout(
  file:     WrafFile,
  options?: Partial<LayoutOptions>,
): ResolvedScreen {
  const opts  = applyLayoutOptions(options);
  const root  = file.root;
  const boxes = collectBoxes(root, opts);

  const growMode = (propValue(root, "growMode") as string | undefined) ?? "vertical";
  const explicitW = hasProp(root, "width")  ? numProp(root, "width")  : 0;
  const explicitH = hasProp(root, "height") ? numProp(root, "height") : 0;

  const width = (growMode === "horizontal" && !hasProp(root, "width") && boxes.length > 0)
    ? Math.max(...boxes.map(b => b.x + b.width))
    : explicitW;
  const height = (growMode === "vertical" && !hasProp(root, "height") && boxes.length > 0)
    ? Math.max(...boxes.map(b => b.y + b.height))
    : explicitH;

  return { width, height, boxes };
}

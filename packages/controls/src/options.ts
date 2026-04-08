import type { LayoutOptions } from "@wrafjs/layout";
import { CONTROLS } from "./registry.js";

export const CONTROLS_LAYOUT_OPTIONS: Partial<LayoutOptions> = {
  intrinsicHeight: new Map(
    CONTROLS
      .filter((c) => c.intrinsicHeight > 0)
      .map((c) => [c.type, c.intrinsicHeight]),
  ),
  intrinsicWidth: new Map(
    CONTROLS
      .filter((c) => c.intrinsicWidth !== undefined)
      .map((c) => [c.type, c.intrinsicWidth!]),
  ),
};

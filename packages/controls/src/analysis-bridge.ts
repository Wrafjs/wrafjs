import type { AnalysisOptions } from "@wrafjs/layout";
import { interactiveTypes } from "./registry.js";

export const CONTROLS_ANALYSIS_OPTIONS: Partial<AnalysisOptions> = {
  minTouchTarget:  44,
  interactiveTypes: interactiveTypes(),
};

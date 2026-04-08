import type { ResolvedBox, ResolvedScreen } from "./types.js";

export type AnalysisIssueKind =
  | "overlap"
  | "out-of-bounds"
  | "zero-size"
  | "small-touch-target";

export interface AnalysisIssue {
  kind:    AnalysisIssueKind;
  message: string;
  boxes:   ResolvedBox[];
}

export interface ScreenAnalysis {
  issues: AnalysisIssue[];
}

export interface AnalysisOptions {
  minTouchTarget:   number;
  interactiveTypes: Set<string>;
}

const DEFAULT_ANALYSIS_OPTIONS: AnalysisOptions = {
  minTouchTarget:  24,
  interactiveTypes: new Set(["button", "input", "textfield", "password", "search", "checkbox", "radio", "switch", "toggle"]),
};

function intersects(a: ResolvedBox, b: ResolvedBox): boolean {
  return (
    a.x < b.x + b.width  &&
    a.x + a.width  > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function analyzeScreen(
  screen:   ResolvedScreen,
  options?: Partial<AnalysisOptions>,
): ScreenAnalysis {
  const opts: AnalysisOptions = { ...DEFAULT_ANALYSIS_OPTIONS, ...options };
  const { boxes, width, height } = screen;
  const issues: AnalysisIssue[] = [];

  for (const box of boxes) {
    if (box.width === 0 || box.height === 0) {
      issues.push({
        kind:    "zero-size",
        message: `${box.node.type} tiene ${box.width === 0 ? "ancho" : "alto"} cero`,
        boxes:   [box],
      });
    }
  }

  if (width > 0 && height > 0) {
    for (const box of boxes) {
      if (
        box.x < 0 || box.y < 0 ||
        box.x + box.width  > width ||
        box.y + box.height > height
      ) {
        issues.push({
          kind:    "out-of-bounds",
          message: `${box.node.type} en (${box.x},${box.y}) se sale del canvas (${width}×${height})`,
          boxes:   [box],
        });
      }
    }
  }

  const byDepth = new Map<number, ResolvedBox[]>();
  for (const box of boxes) {
    const arr = byDepth.get(box.depth) ?? [];
    arr.push(box);
    byDepth.set(box.depth, arr);
  }
  for (const peers of byDepth.values()) {
    for (let i = 0; i < peers.length; i++) {
      for (let j = i + 1; j < peers.length; j++) {
        if (intersects(peers[i], peers[j])) {
          issues.push({
            kind:    "overlap",
            message: `${peers[i].node.type} se superpone con ${peers[j].node.type} en profundidad ${peers[i].depth}`,
            boxes:   [peers[i], peers[j]],
          });
        }
      }
    }
  }

  for (const box of boxes) {
    if (opts.interactiveTypes.has(box.node.type.toLowerCase())) {
      if (box.width < opts.minTouchTarget || box.height < opts.minTouchTarget) {
        issues.push({
          kind:    "small-touch-target",
          message: `${box.node.type} es ${box.width}×${box.height}px, por debajo del mínimo de ${opts.minTouchTarget}px`,
          boxes:   [box],
        });
      }
    }
  }

  return { issues };
}

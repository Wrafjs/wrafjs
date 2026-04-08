import type { WrafNode } from "@wrafjs/parser";
import type { ResolvedBox } from "./types.js";

export function findByType(root: WrafNode, type: string): WrafNode[] {
  const results: WrafNode[] = [];
  const lower = type.toLowerCase();
  function walk(node: WrafNode): void {
    if (node.type.toLowerCase() === lower) results.push(node);
    for (const child of node.children) walk(child);
  }
  walk(root);
  return results;
}

export function findByLabel(root: WrafNode, label: string): WrafNode[] {
  const results: WrafNode[] = [];
  function walk(node: WrafNode): void {
    if (node.label === label) results.push(node);
    for (const child of node.children) walk(child);
  }
  walk(root);
  return results;
}

export function findBoxes(
  boxes:     ResolvedBox[],
  predicate: (box: ResolvedBox) => boolean,
): ResolvedBox[] {
  return boxes.filter(predicate);
}

export function hitTest(boxes: ResolvedBox[], x: number, y: number): ResolvedBox | null {
  let best: ResolvedBox | null = null;
  for (const box of boxes) {
    if (x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height) {
      if (!best || box.depth >= best.depth) best = box;
    }
  }
  return best;
}

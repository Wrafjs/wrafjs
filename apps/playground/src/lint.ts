import { linter, lintGutter, type Diagnostic } from "@codemirror/lint";
import type { EditorView } from "@codemirror/view";
import type { Text } from "@codemirror/state";
import { parse } from "@wrafjs/parser";
import { CONTROLS_VALIDATOR_OPTIONS } from "@wrafjs/controls";

function tokenEnd(doc: Text, from: number): number {
  const line = doc.lineAt(from);
  const col  = from - line.from;
  let   end  = col;
  const text = line.text;
  while (end < text.length && /[\w"'.]/.test(text[end])) end++;
  const to = line.from + (end > col ? end : col + 1);
  return Math.min(to, doc.length);
}

function buildDiagnostics(view: EditorView): Diagnostic[] {
  const text = view.state.doc.toString();
  if (!text.trim()) return [];
  try {
    const result = parse(text, { validatorOptions: CONTROLS_VALIDATOR_OPTIONS });
    return result.errors.map((e): Diagnostic => ({
      from:     e.offset,
      to:       tokenEnd(view.state.doc, e.offset),
      severity: e.severity === "warning" ? "warning" : "error",
      message:  `[${e.source}] ${e.message}`,
      source:   "wraf",
    }));
  } catch {
    return [];
  }
}

export function wrafLinter() {
  return [
    linter(buildDiagnostics, { delay: 400 }),
    lintGutter(),
  ];
}

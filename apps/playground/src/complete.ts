import {
  autocompletion,
  closeBrackets,
  type CompletionContext,
  type CompletionResult,
  type Completion,
} from "@codemirror/autocomplete";
import type { EditorState } from "@codemirror/state";
import { allControls, CONTROL_PROPS } from "@wrafjs/controls";

// ── Universal props (valid on every node) ─────────────────────────────────────

const UNIVERSAL: Record<string, { type: string; values?: string[] }> = {
  x:        { type: "number" },
  y:        { type: "number" },
  width:    { type: "number" },
  height:   { type: "number" },
  padding:  { type: "number" },
  gap:      { type: "number" },
  id:       { type: "string" },
  layout:   { type: "enum", values: ["horizontal", "vertical"] },
  position: { type: "enum", values: [
    "topleft", "top", "topright",
    "left", "center", "right",
    "bottomleft", "bottomcenter", "bottomright",
  ]},
  growMode: { type: "enum", values: ["vertical", "horizontal", "none"] },
};

// ── Context detection ─────────────────────────────────────────────────────────

function findEnclosingType(state: EditorState, pos: number): string | null {
  const currentLine   = state.doc.lineAt(pos);
  const currentIndent = (currentLine.text.match(/^(\s*)/)?.[1] ?? "").length;
  for (let n = currentLine.number - 1; n >= 1; n--) {
    const line = state.doc.line(n);
    const m    = line.text.match(/^(\s*)([A-Z][A-Za-z0-9]*)/);
    if (!m) continue;
    if (m[1].length < currentIndent) return m[2];
  }
  return null;
}

// ── Completion source ─────────────────────────────────────────────────────────

export function wrafCompletions(context: CompletionContext): CompletionResult | null {
  const { state, pos, explicit } = context;
  const line   = state.doc.lineAt(pos);
  const before = line.text.slice(0, pos - line.from);

  // ── Value completions ───────────────────────────────────────────────────────
  const valueMatch = before.match(/^(\s+)([a-z][A-Za-z0-9]*):\s*(\w*)$/);
  if (valueMatch) {
    const propName = valueMatch[2].toLowerCase();
    const partial  = valueMatch[3];
    const from     = pos - partial.length;

    const universal = UNIVERSAL[propName];
    if (universal?.values)
      return { from, options: universal.values.map(v => ({ label: v, type: "constant" })) };

    const enclosing = findEnclosingType(state, pos);
    if (enclosing) {
      const spec = CONTROL_PROPS.get(enclosing.toLowerCase())?.[propName];
      if (spec?.type === "enum" && spec.enumValues)
        return { from, options: [...spec.enumValues].map(v => ({ label: v, type: "constant" })) };
      if (spec?.type === "boolean")
        return { from, options: [{ label: "true", type: "keyword" }, { label: "false", type: "keyword" }] };
    }
    return null;
  }

  // ── Property name completions ───────────────────────────────────────────────
  const propMatch = before.match(/^(\s+)([a-z][A-Za-z0-9]*)$/);
  if (propMatch || (before.match(/^\s+$/) && explicit)) {
    const partial   = propMatch?.[2] ?? "";
    const from      = pos - partial.length;
    const enclosing = findEnclosingType(state, pos);
    const seen      = new Set<string>();
    const options: Completion[] = [];

    for (const [name, meta] of Object.entries(UNIVERSAL)) {
      seen.add(name);
      options.push({ label: name, detail: meta.type, type: "property", apply: `${name}: ` });
    }
    if (enclosing) {
      const typeProps = CONTROL_PROPS.get(enclosing.toLowerCase());
      if (typeProps) {
        for (const [name, spec] of Object.entries(typeProps)) {
          if (!seen.has(name))
            options.push({ label: name, detail: spec.type, type: "property", apply: `${name}: ` });
        }
      }
    }
    return { from, options };
  }

  // ── Node type completions ───────────────────────────────────────────────────
  const typeMatch = before.match(/^(\s*)([A-Z][A-Za-z0-9]*)$/);
  if (typeMatch || (before.match(/^\s*$/) && explicit)) {
    const partial = typeMatch?.[2] ?? "";
    const from    = pos - partial.length;
    return {
      from,
      options: allControls().map(ctrl => ({
        label:  ctrl.label,
        detail: `${ctrl.category} · ${ctrl.intrinsicHeight > 0 ? ctrl.intrinsicHeight + "px" : "fill"}`,
        info:   ctrl.description ?? "",
        type:   "type",
        apply:  `${ctrl.label} {\n  \n}`,
      })),
    };
  }

  return null;
}

export function wrafAutocomplete() {
  return [
    autocompletion({ override: [wrafCompletions], closeOnBlur: false }),
    closeBrackets(),
  ];
}

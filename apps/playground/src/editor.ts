import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
} from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { defaultKeymap, indentWithTab, history, historyKeymap } from "@codemirror/commands";
import { foldGutter, codeFolding, foldKeymap, foldService } from "@codemirror/language";
import { wrafLanguage, wrafHighlighting } from "./wraf-language";
import { wrafAutocomplete } from "./complete";
import { wrafLinter } from "./lint";

// Fold ranges are { } blocks in wraf nodes.
const wrafFoldService = foldService.of((state, lineStart, lineEnd) => {
  const line = state.doc.sliceString(lineStart, lineEnd);
  const braceIdx = line.indexOf("{");
  if (braceIdx === -1) return null;

  const from = lineStart + braceIdx;
  let depth = 0;
  for (let i = from; i < state.doc.length; i++) {
    const ch = state.doc.sliceString(i, i + 1);
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        if (state.doc.lineAt(i).number > state.doc.lineAt(from).number) {
          return { from: from + 1, to: i };
        }
        return null;
      }
    }
  }
  return null;
});

const wrafTheme = EditorView.theme(
  {
    "&": {
      height: "100%",
      background: "#1e1e2e",
      color: "#cdd6f4",
      fontSize: "13px",
      fontFamily: "'Consolas', 'Monaco', 'Menlo', monospace",
    },
    "&.cm-focused": {
      outline: "none",
    },
    ".cm-content": {
      padding: "8px 0",
      caretColor: "#cdd6f4",
      lineHeight: "1.6",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "#cdd6f4",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
      background: "rgba(127, 119, 221, 0.3) !important",
    },
    ".cm-activeLine": {
      background: "rgba(255, 255, 255, 0.03)",
    },
    ".cm-gutters": {
      background: "#181825",
      color: "#4a4a6a",
      border: "none",
      borderRight: "1px solid #313244",
    },
    ".cm-activeLineGutter": {
      background: "rgba(255, 255, 255, 0.03)",
      color: "#7F77DD",
    },
    ".cm-lineNumbers .cm-gutterElement": {
      minWidth: "3em",
      padding: "0 8px 0 4px",
    },
    ".cm-scroller": {
      overflow: "auto",
      fontFamily: "inherit",
    },
    ".cm-foldGutter .cm-gutterElement": {
      cursor: "pointer",
      padding: "0 4px",
      color: "#4a4a6a",
    },
    ".cm-foldGutter .cm-gutterElement:hover": {
      color: "#7F77DD",
    },
    ".cm-foldPlaceholder": {
      background: "rgba(127, 119, 221, 0.15)",
      border: "1px solid rgba(127, 119, 221, 0.3)",
      color: "#7F77DD",
      borderRadius: "3px",
      padding: "0 4px",
      cursor: "pointer",
    },
    ".cm-line": {
      padding: "0 16px",
    },
  },
  { dark: true },
);

export function createWrafEditor(
  parent: HTMLElement,
  initialDoc: string,
  onChange: (value: string) => void,
  onCursor?: (offset: number) => void,
): EditorView {
  const state = EditorState.create({
    doc: initialDoc,
    extensions: [
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap, indentWithTab]),
      codeFolding(),
      foldGutter(),
      wrafFoldService,
      wrafLanguage(),
      wrafHighlighting(),
      wrafTheme,
      ...wrafAutocomplete(),
      ...wrafLinter(),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChange(update.state.doc.toString());
        }
        if (onCursor && (update.selectionSet || update.docChanged)) {
          onCursor(update.state.selection.main.head);
        }
      }),
    ],
  });

  return new EditorView({ state, parent });
}

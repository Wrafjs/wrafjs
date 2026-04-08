import { StreamLanguage, HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { Tag, tags } from "@lezer/highlight";
import type { Extension } from "@codemirror/state";

// ── Custom highlight tags ─────────────────────────────────────────────────────

const t = {
  nodeKeyword: Tag.define(),   // Screen, Card, Button… → blue/purple
  enumValue:   Tag.define(),   // identifier after ':'   → teal
  propName:    Tag.define(),   // identifier before ':'  → muted
  boolLit:     Tag.define(),   // true / false           → amber
};

// ── Keyword sets ──────────────────────────────────────────────────────────────

const NODE_KEYWORDS = new Set([
  // Root
  "Screen",
  // Layout
  "Row", "Column",
  // Containers
  "Card", "Modal", "Drawer",
  // Navigation
  "Navbar", "Tabbar", "Tab", "Sidebar",
  // Forms
  "Button", "Input", "Textarea", "Password", "Search",
  "Select", "Checkbox", "Radio", "RadioGroup", "Slider", "Switch",
  // Content
  "Text", "Heading", "Paragraph", "Label",
  "Image", "Icon", "Avatar", "Badge", "Separator", "Divider",
  // Feedback
  "Alert", "Toast", "Spinner", "Progress", "Skeleton",
  // Data
  "Table", "Tablerow", "List", "Listitem", "Pagination",
  // Aliases
  "TextField", "Dropdown", "Toggle",
]);

// ── Lexer state ───────────────────────────────────────────────────────────────

interface State {
  afterColon: boolean;
  inBlock:    boolean;
}

// ── StreamLanguage definition ─────────────────────────────────────────────────

const wrafStream = StreamLanguage.define<State>({
  name: "wraf",

  startState: (): State => ({ afterColon: false, inBlock: false }),

  token(stream, state): string | null {
    if (state.inBlock) {
      if (stream.match("*/")) {
        state.inBlock = false;
      } else {
        while (!stream.eol()) {
          if (stream.match("*/", false)) break;
          stream.next();
        }
      }
      return "blockComment";
    }

    if (stream.eatSpace()) return null;

    if (stream.match("//")) {
      stream.skipToEnd();
      return "lineComment";
    }

    if (stream.match("/*")) {
      state.inBlock = true;
      while (!stream.eol()) {
        if (stream.match("*/")) { state.inBlock = false; break; }
        stream.next();
      }
      return "blockComment";
    }

    if (stream.peek() === '"') {
      stream.next();
      while (!stream.eol()) {
        if (stream.next() === '"') break;
      }
      state.afterColon = false;
      return "string";
    }

    if (/\d/.test(stream.peek() ?? "")) {
      stream.match(/[0-9]+/);
      state.afterColon = false;
      return "number";
    }

    if (stream.peek() === ":") {
      stream.next();
      state.afterColon = true;
      return "punctuation";
    }

    if (stream.peek() === "{" || stream.peek() === "}") {
      stream.next();
      state.afterColon = false;
      return "brace";
    }

    if (/[A-Za-z_]/.test(stream.peek() ?? "")) {
      const m    = stream.match(/[A-Za-z][A-Za-z0-9_]*/);
      const word = Array.isArray(m) ? m[0] : (m as unknown as string) ?? "";

      if (word === "true" || word === "false") {
        state.afterColon = false;
        return "boolLit";
      }

      if (state.afterColon) {
        state.afterColon = false;
        return "enumValue";
      }

      if (NODE_KEYWORDS.has(word)) return "nodeKeyword";
      if (/^[a-z]/.test(word))    return "propName";

      return "labelName";
    }

    stream.next();
    return null;
  },

  tokenTable: {
    nodeKeyword:  t.nodeKeyword,
    enumValue:    t.enumValue,
    propName:     t.propName,
    boolLit:      t.boolLit,
    labelName:    tags.labelName,
    lineComment:  tags.lineComment,
    blockComment: tags.blockComment,
    string:       tags.string,
    number:       tags.number,
    punctuation:  tags.punctuation,
    brace:        tags.bracket,
  },
});

// ── Highlight style ───────────────────────────────────────────────────────────

const wrafHighlightStyle = HighlightStyle.define([
  { tag: t.nodeKeyword,     color: "#7F77DD" },
  { tag: t.enumValue,       color: "#1D9E75" },
  { tag: t.propName,        color: "#6c7086" },
  { tag: t.boolLit,         color: "#BA7517" },
  { tag: tags.labelName,    color: "#a6adc8" },
  { tag: tags.lineComment,  color: "#90f59d", fontStyle: "italic" },
  { tag: tags.blockComment, color: "#90f59d", fontStyle: "italic" },
  { tag: tags.string,       color: "#D85A30" },
  { tag: tags.number,       color: "#378ADD" },
  { tag: tags.bracket,      color: "#cdd6f4" },
  { tag: tags.punctuation,  color: "#6c7086" },
]);

// ── Public exports ────────────────────────────────────────────────────────────

export function wrafLanguage() {
  return wrafStream;
}

export function wrafHighlighting(): Extension {
  return syntaxHighlighting(wrafHighlightStyle);
}

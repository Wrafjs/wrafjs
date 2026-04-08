export type ControlCategory =
  | "layout"
  | "display"
  | "input"
  | "nav"
  | "feedback";

export interface RenderHints {
  fill?:    string;
  stroke?:  string;
  radius?:  number;
  hasText?: boolean;
  icon?:    string;
  opacity?: number;
}

export interface ControlDef {
  type:            string;
  label:           string;
  category:        ControlCategory;
  intrinsicHeight: number;
  intrinsicWidth?: number;
  isInteractive:   boolean;
  description?:    string;
  renderHints?:    RenderHints;
  defaults?:       Record<string, string | number | boolean>;
}

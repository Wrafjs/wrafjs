import type { WrafNode, WrafProperty, WrafFile, WrafValue, WrafEnumValue, WrafPercentValue, SourceLocation } from "./ast.js";
import type { ParseError } from "./errors.js";

// ── Prop spec types ────────────────────────────────────────────────────────────

export type PropType = "number" | "string" | "boolean" | "enum" | "number-or-percent";

export interface PropSpec {
  type:         PropType;
  enumValues?:  Set<string>;
  required?:    boolean;
  description?: string;
}

export interface ValidatorOptions {
  /**
   * Per-type property specs keyed by lower-cased node type name.
   * When provided, props not listed in a type's spec are reported as warnings.
   */
  typeSpecs?: Map<string, Record<string, PropSpec>>;
}

// ── Global props valid on every node ──────────────────────────────────────────
//
// Note: `slot` is intentionally absent — single-file model has no Slot/View binding.

const GLOBAL_PROP_SPECS: Record<string, PropSpec> = {
  x:        { type: "number" },
  y:        { type: "number" },
  width:    { type: "number-or-percent" },
  height:   { type: "number-or-percent" },
  padding:  { type: "number" },
  gap:      { type: "number" },
  id:       { type: "string" },
  layout:   { type: "enum", enumValues: new Set(["horizontal", "vertical"]) },
  growmode: { type: "enum", enumValues: new Set(["vertical", "horizontal", "none"]) },
  position: { type: "enum", enumValues: new Set([
    "topleft", "top", "topright",
    "left", "center", "right",
    "bottomleft", "bottomcenter", "bottomright",
  ]) },
};

// ── Helpers ──────────────────────────────────────────────────────────────────��─

function enumRaw(v: WrafValue): string | null {
  return typeof v === "object" && (v as WrafEnumValue).kind === "Enum"
    ? (v as WrafEnumValue).value.toLowerCase()
    : typeof v === "string" ? v.toLowerCase() : null;
}

function toError(message: string, loc: SourceLocation | undefined, severity?: ParseError["severity"]): ParseError {
  return {
    message,
    line:   loc?.startLine   ?? 1,
    column: loc?.startColumn ?? 1,
    offset: loc?.startOffset ?? 0,
    source: "validator",
    severity,
  };
}

function checkSpec(spec: PropSpec, prop: WrafProperty, errors: ParseError[]): void {
  const v = prop.value;
  if (spec.type === "number") {
    if (typeof v !== "number")
      errors.push(toError(`"${prop.name}" debe ser un número`, prop.loc));
  } else if (spec.type === "string") {
    if (typeof v !== "string")
      errors.push(toError(`"${prop.name}" debe ser un string entre comillas`, prop.loc));
  } else if (spec.type === "boolean") {
    if (typeof v !== "boolean")
      errors.push(toError(`"${prop.name}" debe ser true o false`, prop.loc));
  } else if (spec.type === "enum") {
    const raw = enumRaw(v);
    if (!raw || !spec.enumValues!.has(raw))
      errors.push(toError(
        `"${prop.name}" valor inválido. Válidos: ${[...spec.enumValues!].join(", ")}`,
        prop.loc,
      ));
  } else if (spec.type === "number-or-percent") {
    const isNum = typeof v === "number";
    const isPct = typeof v === "object" && v !== null && (v as WrafPercentValue).kind === "Percent";
    if (!isNum && !isPct)
      errors.push(toError(`"${prop.name}" debe ser un número o porcentaje (ej: 50%)`, prop.loc));
  }
}

function validateProp(
  prop:     WrafProperty,
  typeSpec: Record<string, PropSpec> | undefined,
  errors:   ParseError[],
): void {
  const name = prop.name.toLowerCase();

  const globalSpec = GLOBAL_PROP_SPECS[name];
  if (globalSpec) {
    checkSpec(globalSpec, prop, errors);
    return;
  }

  if (typeSpec) {
    const spec = typeSpec[name];
    if (spec) {
      checkSpec(spec, prop, errors);
    } else {
      errors.push(toError(`Propiedad desconocida: "${prop.name}"`, prop.loc, "warning"));
    }
  }
}

function walkNode(
  node:      WrafNode,
  errors:    ParseError[],
  typeSpecs: Map<string, Record<string, PropSpec>> | undefined,
): void {
  const typeKey  = node.type.toLowerCase();
  const typeSpec = typeSpecs?.get(typeKey);

  if (typeSpecs && !typeSpecs.has(typeKey)) {
    errors.push(toError(`Tipo desconocido: "${node.type}"`, node.loc, "warning"));
  }

  for (const prop of node.properties) {
    validateProp(prop, typeSpec, errors);
  }

  for (const child of node.children) {
    walkNode(child, errors, typeSpecs);
  }
}

export function validate(file: WrafFile, options?: ValidatorOptions): ParseError[] {
  const errors: ParseError[] = [];

  // E001 — el nodo raíz debe ser Screen
  if (file.root.type.toLowerCase() !== "screen") {
    errors.push(toError(
      `El nodo raíz debe ser "Screen". Encontrado: "${file.root.type}"`,
      file.root.loc,
    ));
  }

  // E002 — Screen requiere width y height
  const root = file.root;
  if (root.type.toLowerCase() === "screen") {
    const hasWidth  = root.properties.some((p) => p.name === "width");
    const hasHeight = root.properties.some((p) => p.name === "height");
    if (!hasWidth)  errors.push(toError(`Screen requiere la propiedad "width"`,  root.loc));
    if (!hasHeight) errors.push(toError(`Screen requiere la propiedad "height"`, root.loc));
  }

  walkNode(file.root, errors, options?.typeSpecs);
  return errors;
}

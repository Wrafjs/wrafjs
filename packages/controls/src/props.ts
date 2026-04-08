import type { PropSpec } from "@wrafjs/parser";

// ── Shared prop sets ──────────────────────────────────────────────────────────

const p = {
  str:  (): PropSpec => ({ type: "string" }),
  num:  (): PropSpec => ({ type: "number" }),
  bool: (): PropSpec => ({ type: "boolean" }),
  enm:  (...values: string[]): PropSpec => ({ type: "enum", enumValues: new Set(values) }),
};

const SIZE        = p.enm("xs", "sm", "md", "lg", "xl");
const VARIANT_BTN = p.enm("default", "primary", "secondary", "danger", "ghost", "link");
const VARIANT_TAG = p.enm("default", "primary", "success", "warning", "danger");
const ALIGN       = p.enm("left", "center", "right");
const GROW_MODE   = p.enm("vertical", "horizontal", "none");

const COMMON: Record<string, PropSpec> = {
  hidden:   p.bool(),
  disabled: p.bool(),
};

const LAYOUT_PROPS: Record<string, PropSpec> = {
  growMode: GROW_MODE,
  layout:   p.enm("horizontal", "vertical"),
  gap:      p.num(),
  padding:  p.num(),
};

const VARIANT_TEXT = p.enm(
  "display", "title", "heading", "subheading", "body", "caption",
  "overline", "annotation",
  "h1", "h2", "h3", "h4", "h5", "h6",
);

const WEIGHT_TEXT = p.enm("bold", "semibold", "medium", "normal", "light");

const TEXT_CONTENT: Record<string, PropSpec> = {
  text:     p.str(),
  size:     p.num(),
  variant:  VARIANT_TEXT,
  weight:   WEIGHT_TEXT,
  color:    p.str(),
  align:    ALIGN,
  italic:   p.bool(),
  truncate: p.bool(),
};

const FORM_FIELD: Record<string, PropSpec> = {
  ...COMMON,
  name:        p.str(),
  value:       p.str(),
  placeholder: p.str(),
  required:    p.bool(),
  readonly:    p.bool(),
};

// ── Per-type prop specs ───────────────────────────────────────────────────────

export const CONTROL_PROPS: Map<string, Record<string, PropSpec>> = new Map([

  // layout
  ["screen",     { ...COMMON, ...LAYOUT_PROPS, title: p.str() }],
  ["row",        { ...COMMON, ...LAYOUT_PROPS }],
  ["column",     { ...COMMON, ...LAYOUT_PROPS }],
  ["card",       { ...COMMON, ...LAYOUT_PROPS, title: p.str() }],
  ["modal",      { ...COMMON, ...LAYOUT_PROPS, title: p.str() }],
  ["drawer",     { ...COMMON, ...LAYOUT_PROPS, title: p.str(), side: p.enm("left", "right") }],
  ["scrollview", { ...COMMON, ...LAYOUT_PROPS }],

  // nav
  ["navbar",     { ...COMMON, title: p.str(), logo: p.str() }],
  ["sidebar",    { ...COMMON, title: p.str() }],
  ["tabbar",     { ...COMMON }],
  ["tab",        { ...COMMON, text: p.str(), active: p.bool(), icon: p.str() }],
  ["breadcrumb", { ...COMMON, text: p.str() }],
  ["menu",       { ...COMMON }],
  ["menuitem",   { ...COMMON, text: p.str(), active: p.bool(), icon: p.str() }],
  ["pagination", { ...COMMON, page: p.num(), total: p.num(), pageSize: p.num() }],

  // display
  ["text",      { ...COMMON, ...TEXT_CONTENT }],
  ["heading",   { ...COMMON, ...TEXT_CONTENT }],
  ["label",     { ...COMMON, ...TEXT_CONTENT, for: p.str() }],
  ["paragraph", { ...COMMON, ...TEXT_CONTENT }],
  ["separator", { ...COMMON, orientation: p.enm("horizontal", "vertical") }],
  ["divider",   { ...COMMON, orientation: p.enm("horizontal", "vertical") }],
  ["badge",     { ...COMMON, text: p.str(), variant: VARIANT_TAG, dot: p.bool() }],
  ["avatar",    { ...COMMON, src: p.str(), name: p.str(), size: SIZE }],
  ["icon",      { ...COMMON, name: p.str(), size: p.num(), color: p.str() }],
  ["image",     { ...COMMON, src: p.str(), alt: p.str(), fit: p.enm("fill", "contain", "cover", "none", "scale-down") }],
  ["list",      { ...COMMON }],
  ["listitem",  { ...COMMON, text: p.str(), subtitle: p.str(), icon: p.str() }],
  ["table",     { ...COMMON }],
  ["tablerow",  { ...COMMON, selected: p.bool() }],
  ["skeleton",  { ...COMMON, lines: p.num() }],
  ["code",      { ...COMMON, ...TEXT_CONTENT }],

  // input
  ["button",    { ...COMMON, text: p.str(), variant: VARIANT_BTN, size: SIZE, loading: p.bool(), icon: p.str() }],
  ["input",     { ...FORM_FIELD }],
  ["textfield", { ...FORM_FIELD }],
  ["textarea",  { ...FORM_FIELD, rows: p.num() }],
  ["password",  { ...FORM_FIELD }],
  ["search",    { ...FORM_FIELD }],
  ["select",    { ...FORM_FIELD }],
  ["dropdown",  { ...FORM_FIELD }],
  ["checkbox",  { ...COMMON, text: p.str(), checked: p.bool(), indeterminate: p.bool(), name: p.str(), required: p.bool() }],
  ["radio",     { ...COMMON, text: p.str(), checked: p.bool(), name: p.str(), value: p.str() }],
  ["switch",    { ...COMMON, text: p.str(), checked: p.bool(), name: p.str() }],
  ["toggle",    { ...COMMON, text: p.str(), checked: p.bool(), name: p.str() }],
  ["slider",    { ...COMMON, min: p.num(), max: p.num(), value: p.num(), step: p.num(), name: p.str() }],
  ["fileupload",{ ...COMMON, accept: p.str(), multiple: p.bool(), name: p.str(), text: p.str() }],
  ["form",      { ...COMMON, ...LAYOUT_PROPS }],

  // feedback
  ["alert",    { ...COMMON, text: p.str(), variant: VARIANT_TAG, closable: p.bool() }],
  ["toast",    { ...COMMON, text: p.str(), variant: VARIANT_TAG, closable: p.bool() }],
  ["tooltip",  { ...COMMON, text: p.str(), placement: p.enm("top", "bottom", "left", "right") }],
  ["progress", { ...COMMON, value: p.num(), max: p.num(), indeterminate: p.bool() }],
  ["spinner",  { ...COMMON, size: SIZE }],
]);

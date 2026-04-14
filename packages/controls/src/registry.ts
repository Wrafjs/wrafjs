import type { ControlDef } from "./types.js";

// Colores de referencia para tema claro (SketchPainter):
//   bg canvas:    #faf8f4
//   fill base:    #f4f0e8
//   fill elevado: #ede9df
//   stroke:       #2a2a2a
//   texto:        #1a1a1a

export const CONTROLS: ControlDef[] = [

  // ── Layout ──────────────────────────────────────────────────────────────────

  {
    type: "screen", label: "Screen", category: "layout",
    intrinsicHeight: 0, isInteractive: false,
    description: "Nodo raíz del archivo. Define las dimensiones del canvas.",
    renderHints: { fill: "#faf8f4", stroke: "none", radius: 0 },
    defaults: { width: 1440, height: 900 },
  },
  {
    type: "row", label: "Row", category: "layout",
    intrinsicHeight: 0, isInteractive: false,
    description: "Contenedor transparente de flujo horizontal.",
    renderHints: { fill: "transparent", stroke: "transparent", radius: 0, opacity: 0 },
    defaults: { gap: 8, padding: 0 },
  },
  {
    type: "column", label: "Column", category: "layout",
    intrinsicHeight: 0, isInteractive: false,
    description: "Contenedor transparente de flujo vertical.",
    renderHints: { fill: "transparent", stroke: "transparent", radius: 0, opacity: 0 },
    defaults: { gap: 8, padding: 0 },
  },
  {
    type: "card", label: "Card", category: "layout",
    intrinsicHeight: 0, isInteractive: false,
    description: "Superficie elevada con borde redondeado.",
    renderHints: { fill: "#f4f0e8", stroke: "#2a2a2a", radius: 8 },
    defaults: { padding: 16, gap: 12 },
  },
  {
    type: "modal", label: "Modal", category: "layout",
    intrinsicHeight: 0, isInteractive: false,
    description: "Diálogo overlay. Declarado como hijo de Screen; se renderiza flotando sobre el canvas.",
    renderHints: { fill: "#ede9df", stroke: "#2a2a2a", radius: 8 },
    defaults: { padding: 24, gap: 16, width: 480 },
  },
  {
    type: "drawer", label: "Drawer", category: "layout",
    intrinsicHeight: 0, isInteractive: false,
    description: "Panel lateral deslizante. Declarado como hijo de Screen.",
    renderHints: { fill: "#f4f0e8", stroke: "#2a2a2a", radius: 0 },
    defaults: { padding: 16, gap: 12 },
  },
  {
    type: "scrollview", label: "ScrollView", category: "layout",
    intrinsicHeight: 0, isInteractive: false,
    description: "Contenedor scrollable.",
    renderHints: { fill: "transparent", stroke: "#2a2a2a", radius: 4 },
    defaults: { padding: 16, gap: 8 },
  },

  // ── Nav ─────────────────────────────────────────────────────────────────────

  {
    type: "navbar", label: "Navbar", category: "nav",
    intrinsicHeight: 48, isInteractive: false,
    description: "Barra de navegación superior. Siempre 48px de alto.",
    renderHints: { fill: "#ede9df", stroke: "#2a2a2a", radius: 0, hasText: false },
    defaults: { title: "App" },
  },
  {
    type: "sidebar", label: "Sidebar", category: "nav",
    intrinsicHeight: 0, intrinsicWidth: 220, isInteractive: false,
    description: "Panel de navegación lateral.",
    renderHints: { fill: "#ede9df", stroke: "#2a2a2a", radius: 0 },
    defaults: { padding: 12, gap: 4 },
  },
  {
    type: "tabbar", label: "Tabbar", category: "nav",
    intrinsicHeight: 48, isInteractive: false,
    description: "Barra de pestañas. Siempre 48px de alto.",
    renderHints: { fill: "#f4f0e8", stroke: "#2a2a2a", radius: 0 },
    defaults: {},
  },
  {
    type: "tab", label: "Tab", category: "nav",
    intrinsicHeight: 40, isInteractive: true,
    description: "Pestaña individual dentro de Tabbar.",
    renderHints: { fill: "transparent", stroke: "#2a2a2a", radius: 4, hasText: true },
    defaults: { text: "Tab" },
  },
  {
    type: "breadcrumb", label: "Breadcrumb", category: "nav",
    intrinsicHeight: 32, isInteractive: false,
    description: "Rastro de navegación.",
    renderHints: { fill: "transparent", stroke: "none", hasText: true },
    defaults: { text: "Inicio / Sección / Página" },
  },
  {
    type: "menu", label: "Menu", category: "nav",
    intrinsicHeight: 0, isInteractive: false,
    description: "Contenedor de ítems de menú.",
    renderHints: { fill: "#f4f0e8", stroke: "#2a2a2a", radius: 4 },
    defaults: { padding: 4, gap: 0 },
  },
  {
    type: "menuitem", label: "MenuItem", category: "nav",
    intrinsicHeight: 36, isInteractive: true,
    description: "Ítem individual de menú.",
    renderHints: { fill: "transparent", stroke: "none", hasText: true, radius: 4 },
    defaults: { text: "Ítem" },
  },
  {
    type: "pagination", label: "Pagination", category: "nav",
    intrinsicHeight: 36, isInteractive: true,
    description: "Navegación de páginas.",
    renderHints: { fill: "transparent", stroke: "#2a2a2a", radius: 4 },
    defaults: { total: 50, page: 1 },
  },

  // ── Display ─────────────────────────────────────────────────────────────────

  {
    type: "text", label: "Text", category: "display",
    intrinsicHeight: 20, isInteractive: false,
    description: "Texto de una o varias líneas.",
    renderHints: { fill: "transparent", stroke: "none", hasText: true },
    defaults: { text: "Texto", size: 5 },
  },
  {
    type: "heading", label: "Heading", category: "display",
    intrinsicHeight: 32, isInteractive: false,
    description: "Encabezado. Alias semántico de Text con variant: title.",
    renderHints: { fill: "transparent", stroke: "none", hasText: true },
    defaults: { text: "Encabezado", variant: "title" },
  },
  {
    type: "label", label: "Label", category: "display",
    intrinsicHeight: 24, isInteractive: false,
    description: "Etiqueta corta. Típicamente para campos de formulario.",
    renderHints: { fill: "transparent", stroke: "none", hasText: true },
    defaults: { text: "Etiqueta", size: 6 },
  },
  {
    type: "paragraph", label: "Paragraph", category: "display",
    intrinsicHeight: 60, isInteractive: false,
    description: "Bloque de texto con word-wrap. Altura dinámica.",
    renderHints: { fill: "transparent", stroke: "none", hasText: true },
    defaults: { text: "Texto de párrafo.", size: 5 },
  },
  {
    type: "separator", label: "Separator", category: "display",
    intrinsicHeight: 1, isInteractive: false,
    description: "Línea divisoria horizontal o vertical.",
    renderHints: { fill: "#2a2a2a", stroke: "none", radius: 0 },
    defaults: {},
  },
  // Alias aceptado
  {
    type: "divider", label: "Divider", category: "display",
    intrinsicHeight: 1, isInteractive: false,
    description: "Alias de Separator.",
    renderHints: { fill: "#2a2a2a", stroke: "none", radius: 0 },
    defaults: {},
  },
  {
    type: "badge", label: "Badge", category: "display",
    intrinsicHeight: 20, intrinsicWidth: 44, isInteractive: false,
    description: "Píldora de estado o contador.",
    renderHints: { fill: "#2a2a2a", stroke: "#2a2a2a", radius: 10, hasText: true },
    defaults: { text: "1" },
  },
  {
    type: "avatar", label: "Avatar", category: "display",
    intrinsicHeight: 32, intrinsicWidth: 32, isInteractive: false,
    description: "Círculo de usuario con iniciales.",
    renderHints: { fill: "#c8c0b0", stroke: "#2a2a2a", radius: 16, icon: "◉" },
    defaults: { size: "sm" },
  },
  {
    type: "icon", label: "Icon", category: "display",
    intrinsicHeight: 20, intrinsicWidth: 20, isInteractive: false,
    description: "Ícono vectorial.",
    renderHints: { fill: "#2a2a2a", stroke: "none", icon: "★" },
    defaults: { size: 20 },
  },
  {
    type: "image", label: "Image", category: "display",
    intrinsicHeight: 0, isInteractive: false,
    description: "Imagen o placeholder.",
    renderHints: { fill: "#e0dbd0", stroke: "#2a2a2a", radius: 4, icon: "🖼" },
    defaults: { alt: "Imagen" },
  },
  {
    type: "list", label: "List", category: "display",
    intrinsicHeight: 0, isInteractive: false,
    description: "Contenedor de ListItem.",
    renderHints: { fill: "transparent", stroke: "#2a2a2a", radius: 4 },
    defaults: { gap: 0 },
  },
  {
    type: "listitem", label: "ListItem", category: "display",
    intrinsicHeight: 36, isInteractive: false,
    description: "Fila de lista. 36px sin subtitle, 48px con subtitle.",
    renderHints: { fill: "transparent", stroke: "#c8c0b0", radius: 0, hasText: true },
    defaults: { text: "Ítem de lista", padding: 12 },
  },
  {
    type: "table", label: "Table", category: "display",
    intrinsicHeight: 0, isInteractive: false,
    description: "Contenedor de filas de tabla.",
    renderHints: { fill: "#f4f0e8", stroke: "#2a2a2a", radius: 4 },
    defaults: {},
  },
  {
    type: "tablerow", label: "TableRow", category: "display",
    intrinsicHeight: 40, isInteractive: false,
    description: "Fila de tabla. 40px de alto.",
    renderHints: { fill: "transparent", stroke: "#c8c0b0", radius: 0 },
    defaults: {},
  },
  {
    type: "skeleton", label: "Skeleton", category: "display",
    intrinsicHeight: 20, isInteractive: false,
    description: "Placeholder de carga. Altura = lines × 20px.",
    renderHints: { fill: "#ddd8cc", stroke: "none", radius: 4 },
    defaults: { lines: 1 },
  },
  {
    type: "code", label: "Code", category: "display",
    intrinsicHeight: 0, isInteractive: false,
    description: "Bloque de código monoespaciado.",
    renderHints: { fill: "#e8e4da", stroke: "#2a2a2a", radius: 4, hasText: true },
    defaults: { text: "// código", padding: 12 },
  },

  // ── Input ────────────────────────────────────────────────────────────────────

  {
    type: "button", label: "Button", category: "input",
    intrinsicHeight: 36, isInteractive: true,
    description: "Botón de acción. 6 variants, 5 sizes.",
    renderHints: { fill: "#2a2a2a", stroke: "#2a2a2a", radius: 4, hasText: true },
    defaults: { text: "Botón", variant: "default" },
  },
  {
    type: "input", label: "Input", category: "input",
    intrinsicHeight: 36, isInteractive: true,
    description: "Campo de texto de una línea.",
    renderHints: { fill: "#faf8f4", stroke: "#2a2a2a", radius: 4, hasText: true },
    defaults: { placeholder: "Escribe aquí…" },
  },
  // Alias aceptado
  {
    type: "textfield", label: "TextField", category: "input",
    intrinsicHeight: 36, isInteractive: true,
    description: "Alias de Input.",
    renderHints: { fill: "#faf8f4", stroke: "#2a2a2a", radius: 4, hasText: true },
    defaults: { placeholder: "Escribe aquí…" },
  },
  {
    type: "textarea", label: "TextArea", category: "input",
    intrinsicHeight: 80, isInteractive: true,
    description: "Campo de texto multilínea. Altura = rows × lineHeight + 16.",
    renderHints: { fill: "#faf8f4", stroke: "#2a2a2a", radius: 4, hasText: true },
    defaults: { placeholder: "Escribe aquí…", rows: 3 },
  },
  {
    type: "password", label: "Password", category: "input",
    intrinsicHeight: 36, isInteractive: true,
    description: "Campo de contraseña con caracteres enmascarados.",
    renderHints: { fill: "#faf8f4", stroke: "#2a2a2a", radius: 4, hasText: true, icon: "●●●" },
    defaults: { placeholder: "Contraseña" },
  },
  {
    type: "search", label: "Search", category: "input",
    intrinsicHeight: 36, isInteractive: true,
    description: "Campo de búsqueda con ícono lupa.",
    renderHints: { fill: "#faf8f4", stroke: "#2a2a2a", radius: 4, hasText: true, icon: "🔍" },
    defaults: { placeholder: "Buscar…" },
  },
  {
    type: "select", label: "Select", category: "input",
    intrinsicHeight: 36, isInteractive: true,
    description: "Selector desplegable.",
    renderHints: { fill: "#faf8f4", stroke: "#2a2a2a", radius: 4, hasText: true },
    defaults: { placeholder: "Selecciona…" },
  },
  // Alias aceptado
  {
    type: "dropdown", label: "Dropdown", category: "input",
    intrinsicHeight: 36, isInteractive: true,
    description: "Alias de Select.",
    renderHints: { fill: "#faf8f4", stroke: "#2a2a2a", radius: 4, hasText: true },
    defaults: { placeholder: "Selecciona…" },
  },
  {
    type: "checkbox", label: "Checkbox", category: "input",
    intrinsicHeight: 24, isInteractive: true,
    description: "Casilla de verificación con etiqueta.",
    renderHints: { fill: "#faf8f4", stroke: "#2a2a2a", radius: 2, hasText: true },
    defaults: { text: "Opción" },
  },
  {
    type: "radio", label: "Radio", category: "input",
    intrinsicHeight: 24, isInteractive: true,
    description: "Botón de radio individual.",
    renderHints: { fill: "#faf8f4", stroke: "#2a2a2a", radius: 12, hasText: true },
    defaults: { text: "Opción" },
  },
  {
    type: "switch", label: "Switch", category: "input",
    intrinsicHeight: 20, intrinsicWidth: 36, isInteractive: true,
    description: "Interruptor on/off.",
    renderHints: { fill: "#c8c0b0", stroke: "#2a2a2a", radius: 10 },
    defaults: {},
  },
  // Alias aceptado
  {
    type: "toggle", label: "Toggle", category: "input",
    intrinsicHeight: 20, intrinsicWidth: 36, isInteractive: true,
    description: "Alias de Switch.",
    renderHints: { fill: "#c8c0b0", stroke: "#2a2a2a", radius: 10 },
    defaults: {},
  },
  {
    type: "slider", label: "Slider", category: "input",
    intrinsicHeight: 24, isInteractive: true,
    description: "Control deslizante de rango.",
    renderHints: { fill: "#2a2a2a", stroke: "#2a2a2a", radius: 4 },
    defaults: { min: 0, max: 100, value: 50 },
  },
  {
    type: "fileupload", label: "FileUpload", category: "input",
    intrinsicHeight: 64, isInteractive: true,
    description: "Zona de carga de archivos.",
    renderHints: { fill: "#f4f0e8", stroke: "#2a2a2a", radius: 4 },
    defaults: { text: "Arrastra o haz clic para subir" },
  },
  {
    type: "form", label: "Form", category: "input",
    intrinsicHeight: 0, isInteractive: false,
    description: "Contenedor semántico de formulario.",
    renderHints: { fill: "transparent", stroke: "transparent", radius: 0 },
    defaults: { gap: 12, padding: 0 },
  },

  // ── Feedback ─────────────────────────────────────────────────────────────────

  {
    type: "alert", label: "Alert", category: "feedback",
    intrinsicHeight: 48, isInteractive: false,
    description: "Banner de notificación con variante de color.",
    renderHints: { fill: "#f4f0e8", stroke: "#2a2a2a", radius: 4, hasText: true },
    defaults: { text: "Mensaje de alerta" },
  },
  // Alias aceptado
  {
    type: "toast", label: "Toast", category: "feedback",
    intrinsicHeight: 48, isInteractive: false,
    description: "Alias de Alert.",
    renderHints: { fill: "#f4f0e8", stroke: "#2a2a2a", radius: 4, hasText: true },
    defaults: { text: "Notificación" },
  },
  {
    type: "tooltip", label: "Tooltip", category: "feedback",
    intrinsicHeight: 32, isInteractive: false,
    description: "Etiqueta contextual emergente.",
    renderHints: { fill: "#2a2a2a", stroke: "none", radius: 4, hasText: true },
    defaults: { text: "Tooltip" },
  },
  {
    type: "progress", label: "Progress", category: "feedback",
    intrinsicHeight: 8, isInteractive: false,
    description: "Barra de progreso lineal.",
    renderHints: { fill: "#c8c0b0", stroke: "none", radius: 4 },
    defaults: { value: 50, max: 100 },
  },
  {
    type: "spinner", label: "Spinner", category: "feedback",
    intrinsicHeight: 32, intrinsicWidth: 32, isInteractive: false,
    description: "Indicador de carga circular.",
    renderHints: { fill: "transparent", stroke: "#2a2a2a", radius: 0 },
    defaults: { size: "md" },
  },
];

// ── Lookup helpers ─────────────────────────────────────────────────────────────

export const CONTROL_MAP = new Map(CONTROLS.map((c) => [c.type, c]));

export function getControl(type: string): ControlDef | undefined {
  return CONTROL_MAP.get(type.toLowerCase());
}

export function getDefault(type: string, prop: string): string | number | boolean | undefined {
  return CONTROL_MAP.get(type.toLowerCase())?.defaults?.[prop];
}

export function allControls(): ControlDef[] {
  return CONTROLS;
}

export function isKnownType(type: string): boolean {
  return CONTROL_MAP.has(type.toLowerCase());
}

export function controlsByCategory(category: ControlDef["category"]): ControlDef[] {
  return CONTROLS.filter((c) => c.category === category);
}

export function interactiveTypes(): Set<string> {
  return new Set(CONTROLS.filter((c) => c.isInteractive).map((c) => c.type));
}

import { parse } from "@wrafjs/parser";
import type { ParseError, WrafNode, WrafFile } from "@wrafjs/parser"; // WrafNode used in findBoxAtOffset
import { resolveLayout, analyzeScreen } from "@wrafjs/layout";
import type { ResolvedBox, ResolvedScreen } from "@wrafjs/layout";
import { CONTROLS_LAYOUT_OPTIONS, CONTROLS_VALIDATOR_OPTIONS, CONTROLS_ANALYSIS_OPTIONS } from "@wrafjs/controls";
import { SketchPainter, buildScene, SKETCH_THEME } from "@wrafjs/renderer";
import type { Painter } from "@wrafjs/renderer";
import { createWrafEditor } from "./editor";
import { examples } from "./examples";

// ── State ─────────────────────────────────────────────────────────────────────

let currentSource  = "";
let currentPainter: Painter | null = null;
let lastAst:        WrafFile | null = null;
let lastScreen:     ResolvedScreen | null = null;

// Zoom/pan state (CSS transform applied to canvasSvg)
let zoomK  = 1;
let zoomX  = 0;
let zoomY  = 0;
let panning = false;
let panStart = { x: 0, y: 0, ox: 0, oy: 0 };

// ── DOM refs ──────────────────────────────────────────────────────────────────

const editorContainer = document.getElementById("editor-container") as HTMLElement;
const canvasHost      = document.getElementById("canvas-host")       as HTMLElement;
const canvasSvg       = document.getElementById("canvas-svg")        as unknown as SVGSVGElement;
const errorsBar       = document.getElementById("errors-bar")        as HTMLElement;
const statusEl        = document.getElementById("status")            as HTMLElement;
const exampleSelect   = document.getElementById("example-select")    as HTMLSelectElement;
const btnZoomIn       = document.getElementById("btn-zoom-in")       as HTMLButtonElement;
const btnZoomOut      = document.getElementById("btn-zoom-out")      as HTMLButtonElement;
const btnZoomFit      = document.getElementById("btn-zoom-fit")      as HTMLButtonElement;
const paneResizer     = document.getElementById("pane-resizer")      as HTMLElement;
const editorPane      = document.getElementById("editor-pane")       as HTMLElement;

// ── Zoom helpers ──────────────────────────────────────────────────────────────

function applyZoom(): void {
  canvasSvg.style.transform        = `translate(${zoomX}px, ${zoomY}px) scale(${zoomK})`;
  canvasSvg.style.transformOrigin  = "0 0";
  canvasSvg.style.position         = "absolute";
  canvasSvg.style.top              = "0";
  canvasSvg.style.left             = "0";
}

function zoomAround(cx: number, cy: number, factor: number): void {
  const newK = Math.max(0.1, Math.min(8, zoomK * factor));
  const ratio = newK / zoomK;
  zoomX = cx - ratio * (cx - zoomX);
  zoomY = cy - ratio * (cy - zoomY);
  zoomK = newK;
  applyZoom();
  saveZoom();
}

function fitToWindow(sceneWidth: number, sceneHeight: number): void {
  const hostW  = canvasHost.clientWidth;
  const hostH  = canvasHost.clientHeight;
  const margin = 32;
  // The SVG element is 20px larger than the scene (10px pad on each side).
  const svgW = sceneWidth  + 20;
  const svgH = sceneHeight + 20;
  const k = Math.min((hostW - margin * 2) / svgW, (hostH - margin * 2) / svgH, 1);
  zoomK = k;
  zoomX = (hostW - svgW * k) / 2;
  zoomY = (hostH - svgH * k) / 2;
  applyZoom();
  saveZoom();
}

// ── Render ────────────────────────────────────────────────────────────────────

let lastSceneWidth  = 0;
let lastSceneHeight = 0;

function run(): void {
  const t0 = performance.now();
  if (!currentPainter) return;

  if (!currentSource.trim()) {
    renderErrors([]);
    statusEl.textContent = "—";
    return;
  }

  try {
    const parsed = parse(currentSource, { validatorOptions: CONTROLS_VALIDATOR_OPTIONS });

    const errors = parsed.errors.filter(e => (e.severity ?? "error") === "error");

    if (errors.length > 0 || !parsed.ast) {
      renderErrors(parsed.errors);
      statusEl.textContent = `${errors.length} error${errors.length !== 1 ? "s" : ""}`;
      return;
    }

    lastAst    = parsed.ast;
    const screen = resolveLayout(parsed.ast, CONTROLS_LAYOUT_OPTIONS);
    lastScreen = screen;
    const scene  = buildScene(screen, SKETCH_THEME);

    // Painter renders directly into canvasSvg (sets width/height/viewBox on it)
    currentPainter.render(scene, canvasSvg);
    // Re-apply highlight after painter clears and redraws the SVG
    drawHighlight(currentHighlightBox);
    applyZoom();

    // Auto-fit on first render or if screen size changed
    if (lastSceneWidth !== scene.width || lastSceneHeight !== scene.height) {
      if (!loadZoom()) {
        fitToWindow(scene.width, scene.height);
      }
      lastSceneWidth  = scene.width;
      lastSceneHeight = scene.height;
    }

    renderErrors(parsed.errors.filter(e => (e.severity ?? "error") !== "error"));

    const analysis = analyzeScreen(screen, CONTROLS_ANALYSIS_OPTIONS);
    const elapsed  = Math.round(performance.now() - t0);
    statusEl.textContent = `${screen.boxes.length} boxes · ${elapsed}ms` +
      (analysis.issues.length > 0 ? ` · ⚠ ${analysis.issues.length}` : "");

  } catch (err) {
    statusEl.textContent = "error";
    renderErrors([{
      severity: "error" as const, message: String(err),
      source: "validator" as const, offset: 0, line: 0, column: 0,
    }]);
  }
}

// ── Cursor highlight ──────────────────────────────────────────────────────────

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Returns the ResolvedBox for the deepest AST node whose loc contains `offset`
 * AND that has a resolved box with non-zero dimensions.
 * Falls back to the nearest ancestor that has a box.
 */
function findBoxAtOffset(node: WrafNode, offset: number, boxes: ResolvedBox[]): ResolvedBox | null {
  const loc = node.loc;
  if (!loc || offset < loc.startOffset || offset > loc.endOffset) return null;

  // Try deepest child first
  for (const child of node.children) {
    const found = findBoxAtOffset(child, offset, boxes);
    if (found) return found;
  }

  // Fall back to this node's own box (if it has one with real dimensions)
  for (const box of boxes) {
    if (box.node === node && box.width > 0 && box.height > 0) return box;
  }
  return null;
}

let currentHighlightBox: ResolvedBox | null = null;

function drawHighlight(box: ResolvedBox | null): void {
  // Remove existing highlight group (painter may have cleared svg)
  canvasSvg.querySelector("#wraf-highlight")?.remove();
  if (!box || box.width <= 0 || box.height <= 0) return;

  const g = document.createElementNS(SVG_NS, "g") as SVGGElement;
  g.id = "wraf-highlight";

  const rect = document.createElementNS(SVG_NS, "rect");
  rect.setAttribute("x",              String(box.x - 1));
  rect.setAttribute("y",              String(box.y - 1));
  rect.setAttribute("width",          String(box.width  + 2));
  rect.setAttribute("height",         String(box.height + 2));
  rect.setAttribute("fill",           "none");
  rect.setAttribute("stroke",         "#ea0d0d");
  rect.setAttribute("stroke-width",   "2.5");
  rect.setAttribute("stroke-dasharray", "5 3");
  rect.setAttribute("rx",             "2");
  rect.setAttribute("pointer-events", "none");
  g.appendChild(rect);

  // Label above the box (type name)
  const label = document.createElementNS(SVG_NS, "text");
  label.setAttribute("x",           String(box.x));
  label.setAttribute("y",           String(box.y - 4));
  label.setAttribute("font-size",   "9");
  label.setAttribute("font-family", "'Segoe UI',Arial,sans-serif");
  label.setAttribute("fill",        "#1a6ec7");
  label.setAttribute("pointer-events", "none");
  label.textContent = box.node.type + (box.node.label ? ` ${box.node.label}` : "");
  g.appendChild(label);

  canvasSvg.appendChild(g);
}

function onCursorMove(offset: number): void {
  if (!lastAst || !lastScreen) return;
  const box = findBoxAtOffset(lastAst.root, offset, lastScreen.boxes);
  currentHighlightBox = box;
  drawHighlight(box);
}

function renderErrors(errors: ParseError[]): void {
  errorsBar.innerHTML = "";
  if (errors.length === 0) {
    const el = document.createElement("span");
    el.className   = "no-errors-line";
    el.textContent = "No errors";
    errorsBar.appendChild(el);
    return;
  }
  for (const e of errors) {
    const sev = e.severity ?? "error";
    const el  = document.createElement("span");
    el.className   = sev === "warning" ? "warning-line" : "error-line";
    el.textContent = `[${e.source}] ${e.message}` + (e.line > 0 ? ` (line ${e.line})` : "");
    errorsBar.appendChild(el);
  }
}

// ── Canvas mouse events (zoom + pan) ─────────────────────────────────────────

canvasHost.addEventListener("wheel", (e) => {
  e.preventDefault();
  const rect = canvasHost.getBoundingClientRect();
  const cx   = e.clientX - rect.left;
  const cy   = e.clientY - rect.top;
  zoomAround(cx, cy, Math.exp(-e.deltaY * 0.001 * 3));
}, { passive: false });

canvasHost.addEventListener("pointerdown", (e) => {
  if (e.button !== 0 && e.button !== 1) return;
  panning  = true;
  panStart = { x: e.clientX, y: e.clientY, ox: zoomX, oy: zoomY };
  canvasHost.setPointerCapture(e.pointerId);
  canvasHost.style.cursor = "grabbing";
});

canvasHost.addEventListener("pointermove", (e) => {
  if (!panning) return;
  zoomX = panStart.ox + (e.clientX - panStart.x);
  zoomY = panStart.oy + (e.clientY - panStart.y);
  applyZoom();
});

canvasHost.addEventListener("pointerup", () => {
  if (!panning) return;
  panning = false;
  canvasHost.style.cursor = "";
  saveZoom();
});

canvasHost.addEventListener("pointerleave", () => {
  if (!panning) return;
  panning = false;
  canvasHost.style.cursor = "";
  saveZoom();
});

// ── Zoom toolbar buttons ──────────────────────────────────────────────────────

btnZoomIn.addEventListener("click", () => {
  zoomAround(canvasHost.clientWidth / 2, canvasHost.clientHeight / 2, 1.25);
});
btnZoomOut.addEventListener("click", () => {
  zoomAround(canvasHost.clientWidth / 2, canvasHost.clientHeight / 2, 0.8);
});
btnZoomFit.addEventListener("click", () => {
  clearZoom();
  if (lastSceneWidth > 0) fitToWindow(lastSceneWidth, lastSceneHeight);
});

// ── Pane resizer ──────────────────────────────────────────────────────────────

function initResizer(): void {
  let dragging = false;
  let startX   = 0;
  let startW   = 0;

  paneResizer.addEventListener("pointerdown", (e) => {
    dragging = true;
    startX   = e.clientX;
    startW   = editorPane.offsetWidth;
    paneResizer.classList.add("dragging");
    document.body.style.cursor     = "ew-resize";
    document.body.style.userSelect = "none";
  });
  document.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const newW = Math.max(160, Math.min(800, startW + (e.clientX - startX)));
    editorPane.style.width = `${newW}px`;
  });
  document.addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    paneResizer.classList.remove("dragging");
    document.body.style.cursor     = "";
    document.body.style.userSelect = "";
  });
}

// ── Persistence ───────────────────────────────────────────────────────────────

const STORAGE_KEY      = "wrafjs-playground";
const STORAGE_ZOOM_KEY = "wrafjs-playground-zoom";

interface PersistedState { example?: string; source?: string; }
interface ZoomState { k: number; x: number; y: number; }

function loadState(): PersistedState {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); } catch { return {}; }
}
function saveState(patch: Partial<PersistedState>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...loadState(), ...patch }));
}
function loadZoom(): ZoomState | null {
  try { return JSON.parse(localStorage.getItem(STORAGE_ZOOM_KEY) ?? "null"); } catch { return null; }
}
function saveZoom(): void {
  localStorage.setItem(STORAGE_ZOOM_KEY, JSON.stringify({ k: zoomK, x: zoomX, y: zoomY }));
}
function clearZoom(): void {
  localStorage.removeItem(STORAGE_ZOOM_KEY);
  zoomK = 1; zoomX = 0; zoomY = 0;
}

// ── Examples ─────────────────────────────────────────────────────────────────

function populateExamples(): void {
  for (const [id, ex] of examples) {
    const opt = document.createElement("option");
    opt.value = id;
    opt.text  = ex.label;
    exampleSelect.appendChild(opt);
  }
}

function loadExample(id: string): void {
  const ex = examples.get(id);
  if (!ex) return;
  editorView.dispatch({
    changes: { from: 0, to: editorView.state.doc.length, insert: ex.source },
  });
  clearZoom();
  exampleSelect.value = id;
  saveState({ example: id, source: ex.source });
}

exampleSelect.addEventListener("change", () => {
  const id = exampleSelect.value;
  if (!id) return;
  loadExample(id);
  const url = new URL(window.location.href);
  url.searchParams.set("example", id);
  window.history.replaceState(null, "", url);
});

// ── Init ──────────────────────────────────────────────────────────────────────

const INITIAL_SOURCE = `Screen {
  width: 375
  height: 812

  Navbar { title: "My App"  width: 100% }

  Column {
    width: 100%
    padding: 24
    gap: 16

    Text { text: "Welcome"                    variant: title }
    Text { text: "Edit this file to start."   variant: body  }
    Button { text: "Get Started"  variant: primary  width: 100% }
  }
}
`;

// ── URL param takes priority over localStorage ────────────────────────────────

const urlExample = new URLSearchParams(window.location.search).get("example");

const savedState    = loadState();
const startExample  = urlExample ?? savedState.example;
const initialSource = (startExample ? (examples.get(startExample)?.source ?? null) : null)
  ?? savedState.source
  ?? INITIAL_SOURCE;

// Restore zoom
const savedZoom = loadZoom();
if (savedZoom) { zoomK = savedZoom.k; zoomX = savedZoom.x; zoomY = savedZoom.y; }

// Create editor
const editorView = createWrafEditor(
  editorContainer,
  initialSource,
  (src) => {
    currentSource = src;
    saveState({ source: src });
    run();
  },
  (offset) => onCursorMove(offset),
);

currentSource = initialSource;

// Populate examples
populateExamples();
if (startExample) {
  exampleSelect.value = startExample;
  saveState({ example: startExample });
}

// Init UI
initResizer();
window.addEventListener("resize", () => { applyZoom(); });

// Start painter and render
SketchPainter.create(SKETCH_THEME).then((painter) => {
  currentPainter = painter;
  run();
});

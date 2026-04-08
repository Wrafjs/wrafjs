/**
 * ZoomController — lightweight zoom/pan over an SVG using the browser's native
 * pointer events + wheel, without any external dependency.
 *
 * Features:
 *   - Wheel to zoom (centred on cursor)
 *   - Click-drag to pan
 *   - Pinch-to-zoom on touch devices
 *   - `zoomToFit(scene)` — fits scene inside the host element
 *   - `reset()` — back to identity transform
 *   - `dispose()` — removes all event listeners
 */

import type { Scene } from "./types.js";

export interface ZoomState {
  x: number;
  y: number;
  k: number;
}

const MIN_SCALE = 0.1;
const MAX_SCALE = 8;
const WHEEL_SENSITIVITY = 0.001;

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export class ZoomController {
  private state: ZoomState = { x: 0, y: 0, k: 1 };
  private dragging = false;
  private lastPointer: { x: number; y: number } | null = null;
  private pinchDist: number | null = null;

  private readonly onWheel:       (e: WheelEvent)   => void;
  private readonly onPointerDown: (e: PointerEvent) => void;
  private readonly onPointerMove: (e: PointerEvent) => void;
  private readonly onPointerUp:   (e: PointerEvent) => void;
  private readonly onTouchStart:  (e: TouchEvent)   => void;
  private readonly onTouchMove:   (e: TouchEvent)   => void;

  constructor(
    private readonly host:     HTMLElement | SVGSVGElement,
    private readonly target:   SVGGElement,
    private readonly onChange?: (state: ZoomState) => void,
  ) {
    this.onWheel       = this.handleWheel.bind(this);
    this.onPointerDown = this.handlePointerDown.bind(this);
    this.onPointerMove = this.handlePointerMove.bind(this);
    this.onPointerUp   = this.handlePointerUp.bind(this);
    this.onTouchStart  = this.handleTouchStart.bind(this);
    this.onTouchMove   = this.handleTouchMove.bind(this);

    host.addEventListener("wheel",        this.onWheel       as EventListener, { passive: false });
    host.addEventListener("pointerdown",  this.onPointerDown as EventListener);
    host.addEventListener("pointermove",  this.onPointerMove as EventListener);
    host.addEventListener("pointerup",    this.onPointerUp   as EventListener);
    host.addEventListener("pointerleave", this.onPointerUp   as EventListener);
    host.addEventListener("touchstart",   this.onTouchStart  as EventListener, { passive: false });
    host.addEventListener("touchmove",    this.onTouchMove   as EventListener, { passive: false });
  }

  getState(): ZoomState { return { ...this.state }; }

  setState(state: ZoomState): void {
    this.state = { ...state };
    this.apply();
  }

  reset(): void {
    this.state = { x: 0, y: 0, k: 1 };
    this.apply();
  }

  zoomToFit(scene: Scene, margin = 24): void {
    const hostRect = this.host.getBoundingClientRect();
    const availW   = hostRect.width  - margin * 2;
    const availH   = hostRect.height - margin * 2;
    const k        = clamp(Math.min(availW / scene.width, availH / scene.height), MIN_SCALE, MAX_SCALE);
    const x        = (hostRect.width  - scene.width  * k) / 2;
    const y        = (hostRect.height - scene.height * k) / 2;
    this.state = { x, y, k };
    this.apply();
  }

  dispose(): void {
    this.host.removeEventListener("wheel",        this.onWheel       as EventListener);
    this.host.removeEventListener("pointerdown",  this.onPointerDown as EventListener);
    this.host.removeEventListener("pointermove",  this.onPointerMove as EventListener);
    this.host.removeEventListener("pointerup",    this.onPointerUp   as EventListener);
    this.host.removeEventListener("pointerleave", this.onPointerUp   as EventListener);
    this.host.removeEventListener("touchstart",   this.onTouchStart  as EventListener);
    this.host.removeEventListener("touchmove",    this.onTouchMove   as EventListener);
  }

  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    const rect   = this.host.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const delta  = -e.deltaY * WHEEL_SENSITIVITY;
    this.scaleAround(mouseX, mouseY, Math.exp(delta * 3));
  }

  private handlePointerDown(e: PointerEvent): void {
    if (e.button !== 0 && e.button !== 1) return;
    this.dragging    = true;
    this.lastPointer = { x: e.clientX, y: e.clientY };
    (this.host as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  private handlePointerMove(e: PointerEvent): void {
    if (!this.dragging || !this.lastPointer) return;
    const dx = e.clientX - this.lastPointer.x;
    const dy = e.clientY - this.lastPointer.y;
    this.lastPointer = { x: e.clientX, y: e.clientY };
    this.state.x += dx;
    this.state.y += dy;
    this.apply();
  }

  private handlePointerUp(_e: PointerEvent): void {
    this.dragging    = false;
    this.lastPointer = null;
  }

  private handleTouchStart(e: TouchEvent): void {
    if (e.touches.length === 2) {
      e.preventDefault();
      this.pinchDist = this.touchDist(e);
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    if (e.touches.length !== 2 || this.pinchDist === null) return;
    e.preventDefault();
    const newDist = this.touchDist(e);
    const factor  = newDist / this.pinchDist;
    this.pinchDist = newDist;
    const rect = this.host.getBoundingClientRect();
    const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
    const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
    this.scaleAround(cx, cy, factor);
  }

  private scaleAround(px: number, py: number, factor: number): void {
    const newK = clamp(this.state.k * factor, MIN_SCALE, MAX_SCALE);
    const ratio = newK / this.state.k;
    this.state.x = px - ratio * (px - this.state.x);
    this.state.y = py - ratio * (py - this.state.y);
    this.state.k = newK;
    this.apply();
  }

  private apply(): void {
    this.target.setAttribute(
      "transform",
      `translate(${this.state.x},${this.state.y}) scale(${this.state.k})`,
    );
    this.onChange?.(this.getState());
  }

  private touchDist(e: TouchEvent): number {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.hypot(dx, dy);
  }
}

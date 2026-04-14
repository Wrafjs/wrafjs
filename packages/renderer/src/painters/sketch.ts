import type { DrawCall, RectItem, TextItem, LineItem, CircleItem, IconItem, GroupItem, Painter, Scene, Theme } from "../types.js";
import { SKETCH_THEME } from "../types.js";
import type { RoughSVG } from "roughjs/bin/svg.js";

const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const e = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

/**
 * Renders the scene using Rough.js to give a hand-drawn sketch aesthetic.
 *
 * Usage:
 *   const painter = await SketchPainter.create();
 *   painter.render(scene, svgElement);
 */
export class SketchPainter implements Painter {
  readonly theme: Theme;
  private readonly rough: { svg(el: SVGSVGElement): RoughSVG };

  private constructor(theme: Theme, rough: { svg(el: SVGSVGElement): RoughSVG }) {
    this.theme = theme;
    this.rough = rough;
  }

  static async create(theme: Theme = SKETCH_THEME): Promise<SketchPainter> {
    const mod = await import("roughjs");
    const rough = (mod as any).default ?? mod;
    return new SketchPainter(theme, rough);
  }

  render(scene: Scene, svg: SVGSVGElement): void {
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    // Add 10px tolerance on every side so elements at the screen boundary
    // don't have their selection highlight clipped by the SVG viewport.
    const PAD = 10;
    svg.setAttribute("width",   String(scene.width  + PAD * 2));
    svg.setAttribute("height",  String(scene.height + PAD * 2));
    svg.setAttribute("viewBox", `${-PAD} ${-PAD} ${scene.width + PAD * 2} ${scene.height + PAD * 2}`);

    const rc = this.rough.svg(svg);

    svg.appendChild(svgEl("rect", {
      x: 0, y: 0, width: scene.width, height: scene.height,
      fill: this.theme.canvasBg,
    }));

    for (const call of scene.calls) {
      this.renderCall(svg, call, rc);
    }
  }

  private renderCall(parent: SVGElement, call: DrawCall, rc: RoughSVG): void {
    switch (call.kind) {
      case "rect":   this.drawRect(parent, call, rc);   break;
      case "text":   this.drawText(parent, call);       break;
      case "line":   this.drawLine(parent, call, rc);   break;
      case "circle": this.drawCircle(parent, call, rc); break;
      case "icon":   this.drawIcon(parent, call);       break;
      case "group":  this.drawGroup(parent, call, rc);  break;
    }
  }

  private roughOpts(fill: string, stroke: string) {
    return {
      fill:        fill === "none" || fill === "transparent" ? "transparent" : fill,
      stroke:      stroke === "none" || stroke === "transparent" ? "transparent" : stroke,
      strokeWidth: 1.2,
      roughness:   1.3,
      bowing:      0.8,
      fillStyle:   "solid" as const,
      fillWeight:  0.6,
      hachureGap:  4,
    };
  }

  private drawRect(parent: SVGElement, call: RectItem, rc: RoughSVG): void {
    const node = rc.rectangle(call.x, call.y, call.width, call.height,
      this.roughOpts(call.fill, call.stroke)) as SVGElement;
    if (call.opacity !== 1) node.style.opacity = String(call.opacity);
    parent.appendChild(node);
  }

  private drawLine(parent: SVGElement, call: LineItem, rc: RoughSVG): void {
    parent.appendChild(rc.line(call.x1, call.y1, call.x2, call.y2, {
      stroke:      call.stroke,
      strokeWidth: call.strokeWidth,
      roughness:   1.2,
    }) as SVGElement);
  }

  private drawCircle(parent: SVGElement, call: CircleItem, rc: RoughSVG): void {
    parent.appendChild(rc.circle(call.cx, call.cy, call.r * 2, {
      fill:        call.fill,
      stroke:      call.stroke,
      strokeWidth: 1.2,
      roughness:   1.4,
      fillStyle:   "solid",
    }) as SVGElement);
  }

  private drawText(parent: SVGElement, call: TextItem): void {
    const t = svgEl("text", {
      x:           call.anchorX,
      y:           call.anchorY,
      fill:        call.color,
      "font-size": call.size,
      "font-family": this.theme.fontFamily,
      "font-weight": call.fontWeight ?? (call.bold ? "bold" : "normal"),
      "font-style":  call.italic ? "italic" : "normal",
      "text-anchor": call.align === "center" ? "middle"
                   : call.align === "right"  ? "end"
                   :                           "start",
      "dominant-baseline": "middle",
    });
    t.textContent = call.text;
    parent.appendChild(t);
  }

  private drawIcon(parent: SVGElement, call: IconItem): void {
    const t = svgEl("text", {
      x: call.cx, y: call.cy,
      fill: call.color,
      "font-size": call.iconSize,
      "text-anchor": "middle",
      "dominant-baseline": "middle",
    });
    t.textContent = call.symbol;
    parent.appendChild(t);
  }

  private drawGroup(parent: SVGElement, call: GroupItem, rc: RoughSVG): void {
    const g = svgEl("g", {});
    g.setAttribute("data-type",  call.box.node.type);
    g.setAttribute("data-depth", String(call.box.depth));
    g.setAttribute("data-id",    call.id);
    for (const child of call.children) this.renderCall(g, child, rc);
    parent.appendChild(g);
  }
}

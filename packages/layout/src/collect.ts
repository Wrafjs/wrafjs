import type { WrafNode } from "@wrafjs/parser";
import { propValue, numProp, hasProp, isPropPercent, propPercent } from "./helpers.js";
import { type ResolvedBox, type LayoutOptions, applyLayoutOptions } from "./types.js";
import { measureText, wrapTextLines } from "@wrafjs/parser";

function textSizeKey(node: WrafNode): string | number {
  const v = propValue(node, "variant");
  if (typeof v === "string" && v) return v;
  return hasProp(node, "size") ? numProp(node, "size") : 5;
}

function getLayoutMode(node: WrafNode): "row" | "column" {
  const type = node.type.toLowerCase();
  if (type === "row" || type === "tabbar" || type === "navbar") return "row";
  const v = propValue(node, "layout");
  if (v === "row" || v === "horizontal") return "row";
  return "column";
}

type GrowMode = "vertical" | "horizontal" | "none";

function getGrowMode(node: WrafNode): GrowMode {
  const v = propValue(node, "growMode");
  if (v === "horizontal" || v === "none") return v as GrowMode;
  return "vertical";
}

const POSITION_VALUES = new Set([
  "topleft", "top", "topright",
  "left", "center", "right",
  "bottomleft", "bottomcenter", "bottomright",
]);

function resolvePosition(
  posVal: string,
  childW: number, childH: number,
  originX: number, originY: number,
  contentW: number, contentH: number,
): { x: number; y: number } {
  const cx = originX + (contentW - childW) / 2;
  const cy = originY + (contentH - childH) / 2;
  const rx = originX + contentW - childW;
  const by = originY + contentH - childH;
  switch (posVal.toLowerCase()) {
    case "topleft":      return { x: originX, y: originY };
    case "top":          return { x: cx,      y: originY };
    case "topright":     return { x: rx,      y: originY };
    case "left":         return { x: originX, y: cy      };
    case "center":       return { x: cx,      y: cy      };
    case "right":        return { x: rx,      y: cy      };
    case "bottomleft":   return { x: originX, y: by      };
    case "bottomcenter": return { x: cx,      y: by      };
    case "bottomright":  return { x: rx,      y: by      };
    default:             return { x: originX, y: originY };
  }
}

const TEXT_NODE_TYPES = new Set(["text", "heading", "label", "paragraph"]);

function estimateTextWidth(node: WrafNode): number {
  const text = propValue(node, "text");
  if (typeof text !== "string" || text.length === 0) return 80;
  return Math.ceil(measureText(text, textSizeKey(node)).lineWidth);
}

function estimateParagraphHeight(node: WrafNode, ownW: number, _opts: LayoutOptions): number {
  const text = propValue(node, "text");
  if (typeof text !== "string" || text.length === 0) return 44;
  const size         = textSizeKey(node);
  const m            = measureText("", size);
  const textW        = Math.max(1, ownW - 12);
  const wrappedLines = wrapTextLines(text, textW, size);
  const lineCount    = wrappedLines.length;
  return Math.ceil((m.fontSize + 4) + (lineCount - 1) * m.lineHeight + m.fontSize * 0.4 + 6);
}

function shrinkWidth(node: WrafNode, opts: LayoutOptions): number {
  if (hasProp(node, "width")) {
    if (isPropPercent(node, "width")) return 0;
    return numProp(node, "width");
  }
  if (node.type.toLowerCase() === "separator" || node.type.toLowerCase() === "divider") {
    const orientation = propValue(node, "orientation") as string | undefined;
    return orientation === "vertical" ? 1 : 0;
  }
  if (node.type.toLowerCase() === "icon" && hasProp(node, "size")) {
    const sz = numProp(node, "size");
    if (sz > 0) return sz;
  }
  if (hasProp(node, "size")) {
    const sw = opts.intrinsicWidth.get(`${node.type.toLowerCase()}:${String(propValue(node, "size"))}`);
    if (sw !== undefined) return sw;
  }
  if (node.type.toLowerCase() === "button" || node.type.toLowerCase() === "tab") {
    const text = propValue(node, "text") ?? propValue(node, "label");
    const textW = typeof text === "string" && text.length > 0
      ? Math.ceil(measureText(text, 5).lineWidth)
      : 40;
    return textW + 32;
  }
  const intrinsic = opts.intrinsicWidth.get(node.type.toLowerCase());
  if (intrinsic !== undefined) return intrinsic;
  if (TEXT_NODE_TYPES.has(node.type.toLowerCase())) return estimateTextWidth(node);
  if (getGrowMode(node) === "horizontal" && node.children.length > 0) {
    const padding = hasProp(node, "padding") ? numProp(node, "padding") : opts.defaultPadding;
    const gap     = hasProp(node, "gap")     ? numProp(node, "gap")     : opts.defaultGap;
    const isHoriz = getLayoutMode(node) === "row";
    const flowCh  = node.children.filter(c => !hasProp(c, "x"));
    if (isHoriz) {
      let total = 0, count = 0;
      for (const ch of flowCh) {
        const cw = shrinkWidth(ch, opts);
        if (cw > 0) { total += cw; count++; }
      }
      return count > 0 ? total + (count - 1) * gap + 2 * padding : 0;
    } else {
      let maxW = 0;
      for (const ch of flowCh) {
        const cw = shrinkWidth(ch, opts);
        if (cw > maxW) maxW = cw;
      }
      return maxW > 0 ? maxW + 2 * padding : 0;
    }
  }
  return 0;
}

function nodeWidth(node: WrafNode, availW: number, opts: LayoutOptions): number {
  if (hasProp(node, "width")) {
    if (isPropPercent(node, "width")) return availW > 0 ? propPercent(node, "width", availW) : 0;
    return numProp(node, "width");
  }
  if (node.type.toLowerCase() === "separator" || node.type.toLowerCase() === "divider") {
    const orientation = propValue(node, "orientation") as string | undefined;
    return orientation === "vertical" ? 1 : (availW > 0 ? availW : 0);
  }
  if (node.type.toLowerCase() === "icon" && hasProp(node, "size")) {
    const sz = numProp(node, "size");
    if (sz > 0) return sz;
  }
  if (hasProp(node, "size")) {
    const sw = opts.intrinsicWidth.get(`${node.type.toLowerCase()}:${String(propValue(node, "size"))}`);
    if (sw !== undefined) return sw;
  }
  if ((node.type.toLowerCase() === "checkbox" || node.type.toLowerCase() === "radio")
      && hasProp(node, "text") && availW > 0) {
    return availW;
  }
  if (node.type.toLowerCase() === "button" || node.type.toLowerCase() === "tab") {
    const text = propValue(node, "text") ?? propValue(node, "label");
    const textW = typeof text === "string" && text.length > 0
      ? Math.ceil(measureText(text, 5).lineWidth)
      : 40;
    return textW + 32;
  }
  const intrinsic = opts.intrinsicWidth.get(node.type.toLowerCase());
  if (intrinsic !== undefined) return intrinsic;
  if (getGrowMode(node) === "horizontal") {
    const computed = shrinkWidth(node, opts);
    if (computed > 0) return computed;
  }
  if (availW === 0 && TEXT_NODE_TYPES.has(node.type.toLowerCase())) {
    return estimateTextWidth(node);
  }
  return availW > 0 ? availW : 0;
}

function autoHeight(
  node:   WrafNode,
  ownW:   number,
  availH: number,
  opts:   LayoutOptions,
): number {
  if (hasProp(node, "height")) {
    if (isPropPercent(node, "height")) return availH > 0 ? propPercent(node, "height", availH) : 0;
    return numProp(node, "height");
  }
  if (node.type.toLowerCase() === "paragraph") {
    return estimateParagraphHeight(node, ownW, opts);
  }
  const textType = node.type.toLowerCase();
  if (textType === "text" || textType === "heading" || textType === "label") {
    return Math.ceil(measureText("", textSizeKey(node)).lineHeight);
  }
  if (node.type.toLowerCase() === "navbar") {
    const MIN_H   = 48;
    const padding = hasProp(node, "padding") ? numProp(node, "padding") : 8;
    const gap     = hasProp(node, "gap")     ? numProp(node, "gap")     : opts.defaultGap;
    const flowCh  = node.children.filter(c => !hasProp(c, "y") && propValue(c, "hidden") !== true);
    if (flowCh.length > 0) {
      const isHoriz = getLayoutMode(node) === "row";
      let childrenH = 0;
      if (isHoriz) {
        for (const ch of flowCh) {
          const chH = autoHeight(ch, 0, 0, opts);
          if (chH > childrenH) childrenH = chH;
        }
      } else {
        for (const ch of flowCh) {
          const chH = autoHeight(ch, Math.max(0, ownW - 2 * padding), 0, opts);
          childrenH += chH;
        }
        if (flowCh.length > 1) childrenH += (flowCh.length - 1) * gap;
      }
      return Math.max(MIN_H, childrenH + 2 * padding);
    }
    return MIN_H;
  }
  if (node.type.toLowerCase() === "separator" || node.type.toLowerCase() === "divider") {
    const orientation = propValue(node, "orientation") as string | undefined;
    return orientation === "vertical" ? (availH > 0 ? availH : 0) : 1;
  }
  if (node.type.toLowerCase() === "icon" && hasProp(node, "size")) {
    const sz = numProp(node, "size");
    if (sz > 0) return sz;
  }
  if (node.type.toLowerCase() === "listitem") {
    return hasProp(node, "subtitle") ? 48 : 36;
  }
  if (node.type.toLowerCase() === "skeleton" && hasProp(node, "lines")) {
    const lines = numProp(node, "lines");
    if (lines > 0) return lines * 20;
  }
  if (node.type.toLowerCase() === "textarea" && hasProp(node, "rows")) {
    const rows = numProp(node, "rows");
    if (rows > 0) {
      const m = measureText("", 5);
      return Math.ceil(rows * m.lineHeight + 16);
    }
  }
  const sizePropVal = hasProp(node, "size") ? String(propValue(node, "size")) : undefined;
  if (sizePropVal) {
    const sizedKey      = `${node.type.toLowerCase()}:${sizePropVal}`;
    const sizedIntrinsic = opts.intrinsicHeight.get(sizedKey);
    if (sizedIntrinsic !== undefined) return sizedIntrinsic;
  }
  const intrinsic = opts.intrinsicHeight.get(node.type.toLowerCase());
  if (intrinsic !== undefined) return intrinsic;

  const gm = getGrowMode(node);
  if (gm === "none") return availH > 0 ? availH : 0;
  if (gm === "horizontal") {
    if (availH > 0) return availH;
    const flowCh  = node.children.filter(c => !hasProp(c, "y") && propValue(c, "hidden") !== true);
    const nt3     = node.type.toLowerCase();
    const dp3     = nt3 === "row" || nt3 === "column" ? 0 : opts.defaultPadding;
    const padding = hasProp(node, "padding") ? numProp(node, "padding") : dp3;
    let maxH = 0;
    for (const ch of flowCh) {
      const chW = hasProp(ch, "width") ? numProp(ch, "width") : (opts.intrinsicWidth.get(ch.type.toLowerCase()) ?? 0);
      const chH = autoHeight(ch, chW, 0, opts);
      if (chH > maxH) maxH = chH;
    }
    return maxH > 0 ? maxH + 2 * padding : 0;
  }

  // growMode "vertical" — shrink-wrap from flow children
  const flowChildren = node.children.filter(c => !hasProp(c, "y") && propValue(c, "hidden") !== true);
  if (flowChildren.length > 0) {
    const nt2 = node.type.toLowerCase();
    const defaultPad = nt2 === "row" || nt2 === "column" ? 0
                     : nt2 === "navbar" ? 8
                     : nt2 === "tabbar" ? 4
                     : nt2 === "card" || nt2 === "modal" || nt2 === "drawer" ? opts.cardPadding
                     : nt2 === "screen" ? 0
                     : opts.defaultPadding;
    const padding  = hasProp(node, "padding") ? numProp(node, "padding") : defaultPad;
    const gap      = hasProp(node, "gap")     ? numProp(node, "gap")     : opts.defaultGap;
    const isHoriz  = getLayoutMode(node) === "row";
    const contentW = Math.max(0, ownW - 2 * padding);
    const nt = node.type.toLowerCase();
    const titleExtra = (nt === "card" || nt === "modal" || nt === "drawer")
      && hasProp(node, "title") ? 40 : 0;

    if (isHoriz) {
      let lineW = 0, lineH = 0, totalH = 0, numLines = 0;
      const autoPercentBase = flowChildren.length > 1
        ? Math.max(0, contentW - (flowChildren.length - 1) * gap)
        : contentW;
      for (const ch of flowChildren) {
        const availOnLine = lineW > 0 ? Math.max(0, contentW - lineW) : contentW;
        let chW = isPropPercent(ch, "width")
          ? nodeWidth(ch, autoPercentBase, opts)
          : nodeWidth(ch, availOnLine, opts);
        if (lineW > 0 && (chW === 0 || lineW + chW > contentW)) {
          totalH += lineH; numLines++; lineW = 0; lineH = 0;
          chW = nodeWidth(ch, contentW, opts);
        }
        const chH = autoHeight(ch, chW, 0, opts);
        if (chW > 0) { lineW += chW + gap; }
        if (chH > lineH) lineH = chH;
      }
      if (lineH > 0) { totalH += lineH; numLines++; }
      const gapH = numLines > 1 ? (numLines - 1) * gap : 0;
      if (totalH === 0) {
        if (hasProp(node, "padding")) return 2 * padding;
        return availH > 0 ? availH : 0;
      }
      return totalH + gapH + 2 * padding + titleExtra;
    } else {
      let total = 0, count = 0;
      for (const ch of flowChildren) {
        const chW = nodeWidth(ch, contentW, opts);
        const chH = autoHeight(ch, chW, 0, opts);
        if (chH > 0) { total += chH; count++; }
      }
      if (count === 0) {
        if (hasProp(node, "padding")) return 2 * padding;
        return availH > 0 ? availH : 0;
      }
      return total + (count - 1) * gap + 2 * padding + titleExtra;
    }
  }
  if (hasProp(node, "padding")) return 2 * numProp(node, "padding");
  return availH > 0 ? availH : 0;
}

function walk(
  node:    WrafNode,
  boxes:   ResolvedBox[],
  offsetX: number,
  offsetY: number,
  availW:  number,
  availH:  number,
  depth:   number,
  opts:    LayoutOptions,
): void {
  const absX = offsetX + numProp(node, "x");
  const absY = offsetY + numProp(node, "y");

  const w = nodeWidth(node, availW, opts);
  const h = autoHeight(node, w, availH, opts);

  if (w > 0 || h > 0) {
    boxes.push({ node, x: absX, y: absY, width: w, height: h, depth });
  }

  const nodeTypeLower = node.type.toLowerCase();
  const compactPadding = nodeTypeLower === "navbar" ? 8
                       : nodeTypeLower === "tabbar" ? 4
                       : nodeTypeLower === "row" || nodeTypeLower === "column" ? 0
                       : nodeTypeLower === "card" || nodeTypeLower === "modal" || nodeTypeLower === "drawer" ? opts.cardPadding
                       : nodeTypeLower === "screen" ? 0
                       : null;
  const padding = hasProp(node, "padding") ? numProp(node, "padding")
                : compactPadding !== null   ? compactPadding
                : opts.defaultPadding;

  const TITLE_ROW_H  = 40;
  const titleTopExtra = (nodeTypeLower === "card" || nodeTypeLower === "modal" || nodeTypeLower === "drawer")
    && hasProp(node, "title") ? TITLE_ROW_H : 0;
  const gap     = hasProp(node, "gap") ? numProp(node, "gap") : opts.defaultGap;
  const isHoriz = getLayoutMode(node) === "row";
  const isShrinkW = isHoriz && getGrowMode(node) === "horizontal";

  let navbarTitleW = 0;
  if (nodeTypeLower === "navbar" && hasProp(node, "title")) {
    const titleText = String(propValue(node, "title") ?? "");
    navbarTitleW = titleText.length > 0
      ? Math.ceil(measureText(titleText, 5).lineWidth) + 32
      : 0;
  }

  const contentW = w > 0 ? Math.max(0, w - 2 * padding - navbarTitleW) : 0;
  const contentH = h > 0 ? h - 2 * padding - titleTopExtra : 0;
  let cursorX = absX + padding + navbarTitleW;
  let cursorY = absY + padding + titleTopExtra;
  let lineH = 0, usedW = 0, colW = 0, usedH = 0;

  const flowChildrenForPercent = node.children.filter(
    c => propValue(c, "hidden") !== true && !hasProp(c, "x")
  );
  const percentBase = isHoriz && flowChildrenForPercent.length > 1
    ? Math.max(0, contentW - (flowChildrenForPercent.length - 1) * gap)
    : contentW;

  for (const child of node.children) {
    if (propValue(child, "hidden") === true) continue;

    const hasX   = hasProp(child, "x");
    const hasY   = hasProp(child, "y");
    const childX = numProp(child, "x");
    const childY = numProp(child, "y");

    let childAbsX: number;
    let childAbsY: number;
    let childAvailW = contentW;
    let childAvailH: number;

    const posVal = !hasX && !hasY
      ? (propValue(child, "position") as string | undefined)
      : undefined;

    if (posVal && POSITION_VALUES.has(posVal.toLowerCase())) {
      const childW = nodeWidth(child, contentW, opts);
      const childH = autoHeight(child, childW, contentH, opts);
      const pos = resolvePosition(posVal, childW, childH, absX + padding, absY + padding, contentW, contentH);
      childAbsX = pos.x;
      childAbsY = pos.y;
      childAvailH = contentH;

    } else if (isHoriz && !hasX) {
      const availOnLine = isShrinkW ? 0 : (usedW > 0 ? Math.max(0, contentW - usedW) : contentW);
      const childIsPercent = isPropPercent(child, "width");
      let childW = childIsPercent
        ? nodeWidth(child, percentBase, opts)
        : nodeWidth(child, availOnLine, opts);

      if (usedW > 0 && (childW === 0 || usedW + childW > contentW)) {
        cursorY += lineH + gap;
        cursorX = absX + padding;
        usedW = 0;
        lineH = 0;
        childW = childIsPercent
          ? nodeWidth(child, percentBase, opts)
          : nodeWidth(child, contentW, opts);
      }
      const lineChildH = autoHeight(child, childW, contentH, opts);
      childAbsX = cursorX;
      childAbsY = cursorY;
      childAvailW = childIsPercent ? percentBase : childW;
      if (childW > 0) { cursorX += childW + gap; usedW += childW + gap; }
      if (lineChildH > lineH) lineH = lineChildH;
      childAvailH = contentH;

    } else if (isHoriz) {
      childAbsX = absX + childX;
      childAbsY = hasY ? absY + childY : cursorY;
      childAvailH = contentH;

    } else if (!hasY) {
      const childW = nodeWidth(child, contentW, opts);
      // Only give percent-height children a non-zero availH so that height: X%
      // resolves against the parent's known height. Auto-sized nodes must get 0
      // or they fall through to availH-fill behaviour in autoHeight.
      const childAvailHForPercent = isPropPercent(child, "height") ? contentH : 0;
      let flowChildH = autoHeight(child, childW, childAvailHForPercent, opts);
      const isColumnNode = node.type.toLowerCase() === "column";
      if (isColumnNode && contentH > 0 && usedH > 0 && (flowChildH === 0 || usedH + flowChildH > contentH)) {
        cursorX += colW + gap;
        cursorY = absY + padding;
        usedH = 0; colW = 0;
        flowChildH = autoHeight(child, childW, childAvailHForPercent, opts);
      }
      childAbsX = cursorX;
      childAbsY = cursorY;
      if (flowChildH > 0) { cursorY += flowChildH + gap; usedH += flowChildH + gap; }
      if (childW > colW) colW = childW;
      childAvailH = childAvailHForPercent;

    } else {
      childAbsX = hasX ? absX + childX : cursorX;
      childAbsY = absY + childY;
      childAvailH = contentH;
    }

    walk(child, boxes, childAbsX - childX, childAbsY - childY, childAvailW, childAvailH, depth + 1, opts);
  }
}

export function collectBoxes(
  root:     WrafNode,
  options?: Partial<LayoutOptions>,
): ResolvedBox[] {
  const opts: LayoutOptions = applyLayoutOptions(options);
  const boxes: ResolvedBox[] = [];
  walk(root, boxes, 0, 0, 0, 0, 0, opts);
  return boxes;
}

import type { WrafNode } from "@wrafjs/parser";

export interface ResolvedBox {
  node:   WrafNode;
  x:      number;
  y:      number;
  width:  number;
  height: number;
  depth:  number;
}

export interface ResolvedScreen {
  width:  number;
  height: number;
  boxes:  ResolvedBox[];
}

export interface LayoutOptions {
  defaultPadding:  number;
  defaultGap:      number;
  cardPadding:     number;
  viewPadding:     number;
  intrinsicHeight: Map<string, number>;
  intrinsicWidth:  Map<string, number>;
}

export function applyLayoutOptions(options?: Partial<LayoutOptions>): LayoutOptions {
  return {
    ...DEFAULT_LAYOUT_OPTIONS,
    ...options,
    intrinsicHeight: options?.intrinsicHeight
      ? new Map([...DEFAULT_LAYOUT_OPTIONS.intrinsicHeight, ...options.intrinsicHeight])
      : DEFAULT_LAYOUT_OPTIONS.intrinsicHeight,
    intrinsicWidth: options?.intrinsicWidth
      ? new Map([...DEFAULT_LAYOUT_OPTIONS.intrinsicWidth, ...options.intrinsicWidth])
      : DEFAULT_LAYOUT_OPTIONS.intrinsicWidth,
  };
}

export const DEFAULT_LAYOUT_OPTIONS: LayoutOptions = {
  defaultPadding: 10,
  defaultGap:     8,
  cardPadding:    16,
  viewPadding:    24,
  intrinsicWidth: new Map([
    // Avatar — size-qualified
    ["avatar",     32],
    ["avatar:xs",  24],
    ["avatar:sm",  32],
    ["avatar:md",  40],
    ["avatar:lg",  48],
    ["avatar:xl",  64],
    ["icon",       20],
    ["badge",      44],
    ["radio",      16],
    ["switch",     36],
    ["toggle",     36],
    ["separator",   1],
    ["divider",     1],
    // Spinner — size-qualified
    ["spinner",    32],
    ["spinner:xs", 16],
    ["spinner:sm", 24],
    ["spinner:md", 32],
    ["spinner:lg", 40],
    ["spinner:xl", 48],
    // Sidebar fixed width
    ["sidebar",   220],
  ]),
  intrinsicHeight: new Map([
    // Typography
    ["text",       36],
    ["label",      24],
    ["heading",    28],
    ["paragraph",  44],
    ["separator",   1],
    ["divider",     1],
    // Button — size-qualified
    ["button",     36],
    ["button:xs",  24],
    ["button:sm",  28],
    ["button:md",  36],
    ["button:lg",  44],
    ["button:xl",  52],
    // Form inputs
    ["input",      36],
    ["textfield",  36],
    ["password",   36],
    ["search",     36],
    ["textarea",   80],
    ["select",     36],
    ["dropdown",   36],
    ["checkbox",   24],
    ["radio",      24],
    ["switch",     20],
    ["toggle",     20],
    ["slider",     24],
    ["fileupload", 64],
    // Display
    ["badge",      20],
    // Avatar — size-qualified
    ["avatar",     32],
    ["avatar:xs",  24],
    ["avatar:sm",  32],
    ["avatar:md",  40],
    ["avatar:lg",  48],
    ["avatar:xl",  64],
    ["icon",       20],
    ["progress",    8],
    // Spinner — size-qualified
    ["spinner",    32],
    ["spinner:xs", 16],
    ["spinner:sm", 24],
    ["spinner:md", 32],
    ["spinner:lg", 40],
    ["spinner:xl", 48],
    ["skeleton",   20],
    // Navigation
    ["navbar",     48],
    ["tabbar",     48],
    ["tab",        40],
    ["pagination", 36],
    ["breadcrumb", 32],
    ["menuitem",   36],
    // Feedback
    ["alert",      48],
    ["toast",      48],
    ["tooltip",    32],
  ]),
};

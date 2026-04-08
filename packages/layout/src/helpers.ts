import type { WrafNode, WrafValue, WrafEnumValue, WrafPercentValue } from "@wrafjs/parser";

export function propValue(node: WrafNode, name: string): string | number | boolean | undefined {
  const v = node.properties.find((p) => p.name === name)?.value;
  if (v === undefined) return undefined;
  if (typeof v === "object" && (v as WrafEnumValue).kind === "Enum") return (v as WrafEnumValue).value;
  return v as string | number | boolean;
}

export function numProp(node: WrafNode, name: string): number {
  const v = propValue(node, name);
  return typeof v === "number" ? v : 0;
}

export function hasProp(node: WrafNode, name: string): boolean {
  return node.properties.some((p) => p.name === name);
}

export function isPropPercent(node: WrafNode, name: string): boolean {
  const v = node.properties.find((p) => p.name === name)?.value;
  return typeof v === "object" && v !== null && (v as WrafPercentValue).kind === "Percent";
}

export function propPercent(node: WrafNode, name: string, base: number): number {
  const v = node.properties.find((p) => p.name === name)?.value;
  if (typeof v === "object" && v !== null && (v as WrafPercentValue).kind === "Percent") {
    return base * (v as WrafPercentValue).value / 100;
  }
  return 0;
}

export interface SourceLocation {
  startOffset: number;
  endOffset:   number;
  startLine:   number;
  startColumn: number;
}

export interface WrafEnumValue {
  kind:  "Enum";
  value: string;
}

export interface WrafPercentValue {
  kind:  "Percent";
  value: number;   // raw percentage, e.g. 50 for "50%"
}

export type WrafValue = string | number | boolean | WrafEnumValue | WrafPercentValue;

export interface WrafProperty {
  kind:  "Property";
  name:  string;
  value: WrafValue;
  loc?:  SourceLocation;
}

export interface WrafNode {
  kind:       "Node";
  type:       string;
  label?:     string;
  properties: WrafProperty[];
  children:   WrafNode[];
  loc?:       SourceLocation;
}

export interface WrafFile {
  kind: "File";
  root: WrafNode;
}

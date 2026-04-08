import type { IToken } from "chevrotain";
import { BaseCstVisitor } from "./cst-parser.js";
import type { WrafFile, WrafNode, WrafProperty, WrafValue, WrafEnumValue, WrafPercentValue, SourceLocation } from "./ast.js";

function makeLoc(startToken: IToken, endToken: IToken): SourceLocation {
  return {
    startOffset: startToken.startOffset,
    endOffset:   (endToken.endOffset ?? endToken.startOffset) + 1,
    startLine:   startToken.startLine  ?? 1,
    startColumn: startToken.startColumn ?? 1,
  };
}

type ValueResult = { value: WrafValue; endToken: IToken };

class WrafAstBuilder extends BaseCstVisitor {
  constructor() {
    super();
    this.validateVisitor();
  }

  file(ctx: any): WrafFile {
    return { kind: "File", root: this.visit(ctx.node[0]) as WrafNode };
  }

  node(ctx: any): WrafNode {
    const nameTok  = ctx.NodeName[0]  as IToken;
    const labelTok = ctx.NodeLabel?.[0] as IToken | undefined;
    const rCurly   = ctx.RCurly[0]   as IToken;
    const body     = this.visit(ctx.nodeBody[0]) as { properties: WrafProperty[]; children: WrafNode[] };
    return {
      kind:       "Node",
      type:       nameTok.image,
      label:      labelTok?.image,
      properties: body.properties,
      children:   body.children,
      loc:        makeLoc(nameTok, rCurly),
    };
  }

  nodeBody(ctx: any): { properties: WrafProperty[]; children: WrafNode[] } {
    return {
      properties: (ctx.property ?? []).map((p: any) => this.visit(p) as WrafProperty),
      children:   (ctx.node     ?? []).map((n: any) => this.visit(n) as WrafNode),
    };
  }

  property(ctx: any): WrafProperty {
    const nameTok             = ctx.PropName[0] as IToken;
    const { value, endToken } = this.visit(ctx.value[0]) as ValueResult;
    return {
      kind:  "Property",
      name:  nameTok.image,
      value,
      loc:   makeLoc(nameTok, endToken),
    };
  }

  value(ctx: any): ValueResult {
    if (ctx.StringLiteral) {
      const t = ctx.StringLiteral[0] as IToken;
      return { value: t.image.slice(1, -1), endToken: t };
    }
    if (ctx.PercentLiteral) {
      const t = ctx.PercentLiteral[0] as IToken;
      const pct: WrafPercentValue = { kind: "Percent", value: parseFloat(t.image) };
      return { value: pct, endToken: t };
    }
    if (ctx.NumberLiteral) {
      const t = ctx.NumberLiteral[0] as IToken;
      return { value: parseFloat(t.image), endToken: t };
    }
    if (ctx.True)  { const t = ctx.True[0]  as IToken; return { value: true,  endToken: t }; }
    if (ctx.False) { const t = ctx.False[0] as IToken; return { value: false, endToken: t }; }
    if (ctx.Identifier) {
      const t = ctx.Identifier[0] as IToken;
      const enumVal: WrafEnumValue = { kind: "Enum", value: t.image };
      return { value: enumVal, endToken: t };
    }
    throw new Error("Unknown value type");
  }
}

export const astBuilder = new WrafAstBuilder();

import { CstParser } from "chevrotain";
import {
  allTokens, Identifier, LCurly, RCurly, Colon,
  StringLiteral, PercentLiteral, NumberLiteral, True, False,
} from "./lexer.js";

class WrafCstParser extends CstParser {
  constructor() {
    super(allTokens);
    this.performSelfAnalysis();
  }

  file = this.RULE("file", () => {
    this.SUBRULE(this.node);
  });

  node = this.RULE("node", () => {
    this.CONSUME(Identifier, { LABEL: "NodeName" });
    this.OPTION(() => {
      this.CONSUME2(Identifier, { LABEL: "NodeLabel" });
    });
    this.CONSUME(LCurly);
    this.SUBRULE(this.nodeBody);
    this.CONSUME(RCurly);
  });

  nodeBody = this.RULE("nodeBody", () => {
    this.MANY(() => {
      this.OR([
        { ALT: () => this.SUBRULE(this.property) },
        { ALT: () => this.SUBRULE(this.node) },
      ]);
    });
  });

  property = this.RULE("property", () => {
    this.CONSUME(Identifier, { LABEL: "PropName" });
    this.CONSUME(Colon);
    this.SUBRULE(this.value);
  });

  value = this.RULE("value", () => {
    this.OR([
      { ALT: () => this.CONSUME(StringLiteral)  },
      { ALT: () => this.CONSUME(PercentLiteral) },
      { ALT: () => this.CONSUME(NumberLiteral)  },
      { ALT: () => this.CONSUME(True)           },
      { ALT: () => this.CONSUME(False)          },
      { ALT: () => this.CONSUME(Identifier)     },
    ]);
  });
}

export const cstParser = new WrafCstParser();
export const BaseCstVisitor = cstParser.getBaseCstVisitorConstructorWithDefaults();

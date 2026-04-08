import type { IToken } from "chevrotain";
import { WrafLexer } from "./lexer.js";
import { cstParser } from "./cst-parser.js";
import { astBuilder } from "./ast-builder.js";
import { validate } from "./validator.js";
import type { ValidatorOptions } from "./validator.js";
import type { WrafFile } from "./ast.js";
import type { ParseError } from "./errors.js";

export interface ParseOptions {
  validatorOptions?: ValidatorOptions;
}

export interface ParseResult {
  ast:    WrafFile | null;
  errors: ParseError[];
  tokens: IToken[];
}

export function parse(input: string, options?: ParseOptions): ParseResult {
  // 1. Lex
  const lexResult = WrafLexer.tokenize(input);
  const tokens    = lexResult.tokens;

  const errors: ParseError[] = lexResult.errors.map((e) => ({
    message: e.message,
    line:    e.line   ?? 1,
    column:  e.column ?? 1,
    offset:  e.offset ?? 0,
    source:  "lexer" as const,
  }));

  // 2. Parse CST
  cstParser.input = tokens;
  const cst = cstParser.file();

  errors.push(...cstParser.errors.map((e) => ({
    message: e.message,
    line:    e.token?.startLine   ?? 1,
    column:  e.token?.startColumn ?? 1,
    offset:  e.token?.startOffset ?? 0,
    source:  "parser" as const,
  })));

  if (errors.length > 0) return { ast: null, errors, tokens };

  // 3. Build AST
  const ast = astBuilder.visit(cst) as WrafFile;

  // 4. Validate
  errors.push(...validate(ast, options?.validatorOptions));

  return { ast, errors, tokens };
}

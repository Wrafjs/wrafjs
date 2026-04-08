import { createToken, Lexer } from "chevrotain";

// ── Whitespace (ignorado) ────────────────────────────────────────────────────
export const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /[ \t\n\r]+/,
  group: Lexer.SKIPPED,
});

// ── Comentarios (ignorados) ──────────────────────────────────────────────────
export const LineComment = createToken({
  name: "LineComment",
  pattern: /\/\/.*/,
  group: Lexer.SKIPPED,
});

export const BlockComment = createToken({
  name: "BlockComment",
  pattern: /\/\*[\s\S]*?\*\//,
  group: Lexer.SKIPPED,
});

// ── Booleanos (antes de Identifier para que no sean capturados como Identifier)
export const True  = createToken({ name: "True",  pattern: /true/  });
export const False = createToken({ name: "False", pattern: /false/ });

// ── Símbolos estructurales ───────────────────────────────────────────────────
export const LCurly = createToken({ name: "LCurly", pattern: /{/ });
export const RCurly = createToken({ name: "RCurly", pattern: /}/ });
export const Colon  = createToken({ name: "Colon",  pattern: /:/ });

// ── Literales ────────────────────────────────────────────────────────────────
export const StringLiteral = createToken({
  name: "StringLiteral",
  pattern: /"[^"]*"/,
});

export const PercentLiteral = createToken({
  name: "PercentLiteral",
  pattern: /-?[0-9]+(\.[0-9]+)?%/,
});

export const NumberLiteral = createToken({
  name: "NumberLiteral",
  pattern: /-?[0-9]+(\.[0-9]+)?/,
});

// ── Identificadores (al final para no capturar keywords) ─────────────────────
export const Identifier = createToken({
  name: "Identifier",
  pattern: /[A-Za-z][A-Za-z0-9_]*/,
});

// ── Orden del lexer (importa: más específicos primero) ───────────────────────
export const allTokens = [
  WhiteSpace,
  LineComment,
  BlockComment,
  True,
  False,
  LCurly,
  RCurly,
  Colon,
  StringLiteral,
  PercentLiteral,
  NumberLiteral,
  Identifier,
];

export const WrafLexer = new Lexer(allTokens);

export type ParseErrorSource   = "lexer" | "parser" | "validator";
export type ParseErrorSeverity = "error" | "warning";

export interface ParseError {
  message:   string;
  line:      number;
  column:    number;
  offset:    number;
  source:    ParseErrorSource;
  /** Defaults to "error" when omitted. */
  severity?: ParseErrorSeverity;
}

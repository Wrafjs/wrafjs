import type { ValidatorOptions } from "@wrafjs/parser";
import { CONTROL_PROPS } from "./props.js";

export const CONTROLS_VALIDATOR_OPTIONS: ValidatorOptions = {
  typeSpecs: new Map(
    [...CONTROL_PROPS.entries()].map(([type, spec]) => [
      type,
      Object.fromEntries(Object.entries(spec).map(([k, v]) => [k.toLowerCase(), v])),
    ])
  ),
};

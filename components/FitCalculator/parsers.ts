import { createParser } from "nuqs";

import { FitState } from "./types";
import { INITIAL_FIT_STATE } from "./constants";

type FitStateParserOptions = {
  fallback?: FitState | null;
};

const isNumeric = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isNumericOrEmpty = (value: unknown): value is number | "" =>
  value === "" || isNumeric(value);

const parseFitState = (
  value: string | null,
  fallback: FitStateParserOptions["fallback"]
) => {
  if (!value) {
    console.log("[Parser] No value to parse, returning fallback");
    return fallback ?? null;
  }

  try {
    const parsed = JSON.parse(value);
    console.log("[Parser] Parsed URL state:", parsed);

    // Accept any object and build a valid FitState from it
    if (parsed && typeof parsed === "object") {
      const result: FitState = { ...INITIAL_FIT_STATE };

      // For each field, use the parsed value if valid, otherwise keep default
      if (isNumeric(parsed.stemXOrigin))
        result.stemXOrigin = parsed.stemXOrigin;
      if (isNumeric(parsed.stemYOrigin))
        result.stemYOrigin = parsed.stemYOrigin;
      if (isNumeric(parsed.spacer)) result.spacer = parsed.spacer;
      if (isNumeric(parsed.stem)) result.stem = parsed.stem;
      if (isNumeric(parsed.angleHt)) result.angleHt = parsed.angleHt;
      if (isNumeric(parsed.angleStem)) result.angleStem = parsed.angleStem;
      if (isNumericOrEmpty(parsed.stack)) result.stack = parsed.stack;
      if (isNumericOrEmpty(parsed.reach)) result.reach = parsed.reach;
      if (isNumericOrEmpty(parsed.handlebarStack))
        result.handlebarStack = parsed.handlebarStack;
      if (isNumericOrEmpty(parsed.handlebarReach))
        result.handlebarReach = parsed.handlebarReach;
      if (typeof parsed.name === "string") result.name = parsed.name;

      console.log("[Parser] Returning parsed result:", result);
      return result;
    }
  } catch (error) {
    console.warn("Invalid fit state in query string", error);
  }

  return fallback ?? null;
};

export const createFitStateParser = (options: FitStateParserOptions = {}) =>
  createParser<FitState | null>({
    parse: (value) => parseFitState(value, options.fallback),
    serialize: (value) => {
      if (!value) {
        return null;
      }

      try {
        return JSON.stringify(value);
      } catch (error) {
        console.warn("Unable to serialize fit state", error);
        return null;
      }
    },
  });

export const fitStateParser = createFitStateParser();

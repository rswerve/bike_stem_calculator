import { createParser } from "nuqs";

import { FitState } from "./types";

type FitStateParserOptions = {
  fallback?: FitState | null;
};

const isNumeric = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isNumericOrEmpty = (value: unknown): value is number | "" =>
  value === "" || isNumeric(value);

const isFitState = (value: unknown): value is FitState => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<FitState>;

  return (
    isNumeric(candidate.stemXOrigin) &&
    isNumeric(candidate.stemYOrigin) &&
    isNumeric(candidate.spacer) &&
    isNumeric(candidate.stem) &&
    isNumeric(candidate.angleHt) &&
    isNumeric(candidate.angleStem) &&
    isNumericOrEmpty(candidate.stack) &&
    isNumericOrEmpty(candidate.reach) &&
    isNumericOrEmpty(candidate.handlebarStack) &&
    isNumericOrEmpty(candidate.handlebarReach) &&
    typeof candidate.name === "string"
  );
};

const parseFitState = (
  value: string | null,
  fallback: FitStateParserOptions["fallback"]
) => {
  console.log("[Parser] Parsing value:", value);

  if (!value) {
    console.log("[Parser] No value, returning fallback:", fallback);
    return fallback ?? null;
  }

  try {
    const parsed = JSON.parse(value);
    console.log("[Parser] JSON parsed:", parsed);

    if (isFitState(parsed)) {
      console.log("[Parser] Validation passed, returning:", parsed);
      return parsed;
    }

    console.log("[Parser] Validation FAILED");
  } catch (error) {
    console.warn("[Parser] Invalid fit state in query string", error);
  }

  console.log("[Parser] Returning fallback:", fallback);
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

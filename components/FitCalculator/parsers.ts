import { createParser } from "nuqs";

import { FitState, StemOrientation } from "./types";
import { INITIAL_FIT_STATE } from "./constants";
import { legacyAngleToSetup } from "./utils";

type FitStateParserOptions = {
  fallback?: FitState | null;
};

const isNumeric = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isNumericOrEmpty = (value: unknown): value is number | "" =>
  value === "" || isNumeric(value);

const isOrientation = (value: unknown): value is StemOrientation =>
  value === "up" || value === "flipped";

const parseReference = (value: unknown): FitState["reference"] => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  if (
    !isNumeric(candidate.spacer) ||
    !isNumeric(candidate.stem) ||
    !isNumeric(candidate.stemAngle) ||
    !isOrientation(candidate.orientation)
  ) {
    return null;
  }

  return {
    spacer: candidate.spacer,
    stem: candidate.stem,
    stemAngle: candidate.stemAngle,
    orientation: candidate.orientation,
  };
};

const parseJsonState = (value: string): Record<string, unknown> | null => {
  try {
    return JSON.parse(value) as Record<string, unknown> | null;
  } catch (initialError) {
    if (!/%[0-9a-f]{2}/i.test(value)) {
      throw initialError;
    }

    return JSON.parse(decodeURIComponent(value)) as Record<
      string,
      unknown
    > | null;
  }
};

const parseFitState = (
  value: string | null,
  fallback: FitStateParserOptions["fallback"]
) => {
  if (!value) {
    return fallback ?? null;
  }

  try {
    const parsed = parseJsonState(value);

    if (parsed && typeof parsed === "object") {
      const result: FitState = { ...INITIAL_FIT_STATE };

      if (isNumeric(parsed.spacer)) result.spacer = parsed.spacer;
      if (isNumeric(parsed.stem)) result.stem = parsed.stem;
      if (isNumeric(parsed.angleHt)) result.angleHt = parsed.angleHt;

      if (isNumeric(parsed.stemAngle) && isOrientation(parsed.orientation)) {
        result.stemAngle = parsed.stemAngle;
        result.orientation = parsed.orientation;
      } else if (isNumeric(parsed.angleStem)) {
        const migratedSetup = legacyAngleToSetup(
          result.angleHt,
          parsed.angleStem
        );
        result.stemAngle = migratedSetup.stemAngle;
        result.orientation = migratedSetup.orientation;
      }

      if (isNumericOrEmpty(parsed.stack)) result.stack = parsed.stack;
      if (isNumericOrEmpty(parsed.reach)) result.reach = parsed.reach;
      if (isNumericOrEmpty(parsed.handlebarStack))
        result.handlebarStack = parsed.handlebarStack;
      if (isNumericOrEmpty(parsed.handlebarReach))
        result.handlebarReach = parsed.handlebarReach;
      if (typeof parsed.name === "string") result.name = parsed.name;
      result.reference = parseReference(parsed.reference);

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

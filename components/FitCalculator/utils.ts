import {
  FitState,
  NumericInput,
  StemOrientation,
  StemSetup,
} from "./types";
import {
  TARGET_CLOSE_TOLERANCE_MM,
  TARGET_TOLERANCE_MM,
} from "./constants";

export const getRadians = (angleDegrees: number): number => {
  return (Math.PI / 180) * angleDegrees;
};

export const getInstalledStemAngle = (
  angleHt: number,
  stemAngle: number,
  orientation: StemOrientation
) => {
  const perpendicularToSteerer = 90 - angleHt;
  return orientation === "up"
    ? perpendicularToSteerer + stemAngle
    : perpendicularToSteerer - stemAngle;
};

export const legacyAngleToSetup = (
  angleHt: number,
  installedAngle: number
): Pick<StemSetup, "stemAngle" | "orientation"> => {
  const perpendicularToSteerer = 90 - angleHt;

  return installedAngle >= perpendicularToSteerer
    ? {
        stemAngle: installedAngle - perpendicularToSteerer,
        orientation: "up",
      }
    : {
        stemAngle: perpendicularToSteerer - installedAngle,
        orientation: "flipped",
      };
};

type GeometryState = StemSetup & Pick<FitState, "angleHt">;

export type SetupLayer = "pinned" | "current";
export type TargetProximity = "on-target" | "close" | "far";

const SAME_LINE_EPSILON = 1e-6;

const shorterSegmentOnTop = (
  currentLength: number,
  pinnedLength: number
): SetupLayer[] =>
  currentLength < pinnedLength
    ? ["pinned", "current"]
    : ["current", "pinned"];

export const calculateGeometry = (state: GeometryState) => {
  const installedStemAngle = getInstalledStemAngle(
    state.angleHt,
    state.stemAngle,
    state.orientation
  );

  const spacerRise = state.spacer * Math.sin(getRadians(state.angleHt));
  const spacerRun = state.spacer * Math.sin(getRadians(90 - state.angleHt));
  const stemRise = state.stem * Math.sin(getRadians(installedStemAngle));
  const stemRun = state.stem * Math.cos(getRadians(installedStemAngle));

  const totalRise = spacerRise + stemRise;
  const totalRun = stemRun - spacerRun;
  const topOfHTX = -spacerRun;
  const topOfHTY = -spacerRise;
  const stemEndX = totalRun;
  const stemEndY = -totalRise;

  return {
    installedStemAngle,
    topOfHTX,
    topOfHTY,
    stemEndX,
    stemEndY,
    spacerRise,
    spacerRun,
    stemRise,
    stemRun,
    totalRise,
    totalRun,
  } as const;
};

export const getComparisonDrawOrder = (
  state: GeometryState,
  pinned: StemSetup
) => {
  const currentGeometry = calculateGeometry(state);
  const pinnedGeometry = calculateGeometry({ ...pinned, angleHt: state.angleHt });
  const stemsShareLine =
    Math.abs(currentGeometry.topOfHTX - pinnedGeometry.topOfHTX) <
      SAME_LINE_EPSILON &&
    Math.abs(currentGeometry.topOfHTY - pinnedGeometry.topOfHTY) <
      SAME_LINE_EPSILON &&
    Math.abs(
      currentGeometry.installedStemAngle - pinnedGeometry.installedStemAngle
    ) < SAME_LINE_EPSILON;

  return {
    spacer: shorterSegmentOnTop(state.spacer, pinned.spacer),
    stem: stemsShareLine
      ? shorterSegmentOnTop(state.stem, pinned.stem)
      : (["pinned", "current"] satisfies SetupLayer[]),
    stemsShareLine,
  } as const;
};

export const isFitTargetComplete = (state: FitState) =>
  ![state.stack, state.reach, state.handlebarStack, state.handlebarReach].some(
    isUnset
  );

export const getTargetOffset = (state: FitState) => {
  if (!isFitTargetComplete(state)) {
    return undefined;
  }

  return {
    rise: Number(state.handlebarStack) - Number(state.stack),
    run: Number(state.handlebarReach) - Number(state.reach),
  };
};

export const getAxisDifferenceDisplay = (
  difference: number,
  negativeLabel: string,
  positiveLabel: string
) => {
  const rounded = Math.round(difference);
  if (rounded === 0) {
    return { value: "Exact", detail: "" };
  }

  return {
    value: String(Math.abs(rounded)),
    detail: `mm ${rounded < 0 ? negativeLabel : positiveLabel}`,
  };
};

export const formatAxisDifference = (
  difference: number,
  negativeLabel: string,
  positiveLabel: string
) => {
  const { value, detail } = getAxisDifferenceDisplay(
    difference,
    negativeLabel,
    positiveLabel
  );
  return detail ? `${value} ${detail}` : value;
};

export const getTargetProximity = (difference: number): TargetProximity => {
  const displayedDifference = Math.abs(Math.round(difference));

  if (displayedDifference <= TARGET_TOLERANCE_MM) {
    return "on-target";
  }

  return displayedDifference <= TARGET_CLOSE_TOLERANCE_MM ? "close" : "far";
};

const isUnset = (value: NumericInput) => value === "" || value === 0;

export const calculateStackDiff = (
  state: FitState,
  spacerRise: number,
  stemRise: number
) => {
  if (isUnset(state.handlebarStack) || isUnset(state.stack)) {
    return undefined;
  }

  return Math.round(
    Number(state.handlebarStack) - (Number(state.stack) + spacerRise + stemRise)
  );
};

export const calculateReachDiff = (
  state: FitState,
  stemRun: number,
  spacerRun: number
) => {
  if (isUnset(state.handlebarReach) || isUnset(state.reach)) {
    return undefined;
  }

  return Math.round(
    Number(state.handlebarReach) - (Number(state.reach) + stemRun - spacerRun)
  );
};

export const formatDiffMessage = (
  diff: number | undefined,
  tooLargeLabel: string,
  tooSmallLabel: string,
  axisLabel: string
) => {
  if (diff === undefined) {
    return "";
  }

  const status =
    diff !== 0 ? (diff < 0 ? tooLargeLabel : tooSmallLabel) : "JUST RIGHT";

  if (status === "JUST RIGHT") {
    return `${axisLabel} is ${status}`;
  }

  return `${axisLabel} is ${status} by ${Math.abs(diff)}mm`;
};

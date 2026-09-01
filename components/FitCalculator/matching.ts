import {
  ADJUSTABLE_STEM_LENGTHS,
  FIXED_STEM_ANGLES,
  MATCH_SPACER_HEIGHTS,
  MAX_ADJUSTABLE_STEM_ANGLE,
  STEM_LENGTHS,
  TARGET_TOLERANCE_MM,
} from "./constants";
import type { FitState, StemOrientation, StemSetup } from "./types";
import {
  calculateGeometry,
  formatAxisDifference,
  getTargetOffset,
} from "./utils";

export interface SetupMatch extends StemSetup {
  heightDifference: number;
  reachDifference: number;
  roundedHeightDifference: number;
  roundedReachDifference: number;
  heightLabel: string;
  reachLabel: string;
  kind: "current" | "fixed" | "adjustable";
}

const orientationsForAngle = (angle: number): StemOrientation[] =>
  angle === 0 ? ["up"] : ["up", "flipped"];

const compareMatches = (a: SetupMatch, b: SetupMatch) => {
  const displayedDistanceA =
    a.roundedHeightDifference ** 2 + a.roundedReachDifference ** 2;
  const displayedDistanceB =
    b.roundedHeightDifference ** 2 + b.roundedReachDifference ** 2;
  const trueDistanceA = a.heightDifference ** 2 + a.reachDifference ** 2;
  const trueDistanceB = b.heightDifference ** 2 + b.reachDifference ** 2;

  return (
    displayedDistanceA - displayedDistanceB ||
    a.spacer - b.spacer ||
    trueDistanceA - trueDistanceB ||
    a.stemAngle - b.stemAngle ||
    a.stem - b.stem ||
    a.orientation.localeCompare(b.orientation)
  );
};

export const createSetupMatch = (
  state: FitState,
  setup: StemSetup,
  kind: SetupMatch["kind"]
): SetupMatch | undefined => {
  const target = getTargetOffset(state);
  if (!target) {
    return undefined;
  }

  const geometry = calculateGeometry({ ...setup, angleHt: state.angleHt });
  const heightDifference = geometry.totalRise - target.rise;
  const reachDifference = geometry.totalRun - target.run;
  const roundedHeightDifference = Math.round(heightDifference);
  const roundedReachDifference = Math.round(reachDifference);

  return {
    ...setup,
    kind,
    heightDifference,
    reachDifference,
    roundedHeightDifference,
    roundedReachDifference,
    heightLabel: formatAxisDifference(heightDifference, "low", "high"),
    reachLabel: formatAxisDifference(reachDifference, "short", "long"),
  };
};

export const findFixedMatches = (state: FitState): SetupMatch[] => {
  if (!getTargetOffset(state)) {
    return [];
  }

  const matches: SetupMatch[] = [];
  for (const stem of STEM_LENGTHS) {
    for (const stemAngle of FIXED_STEM_ANGLES) {
      for (const orientation of orientationsForAngle(stemAngle)) {
        for (const spacer of MATCH_SPACER_HEIGHTS) {
          const match = createSetupMatch(
            state,
            { stem, stemAngle, orientation, spacer },
            "fixed"
          );
          if (match) matches.push(match);
        }
      }
    }
  }

  return matches.sort(compareMatches);
};

export const findAdjustableFallback = (
  state: FitState,
  fixedMatches: SetupMatch[]
): SetupMatch | undefined => {
  if (
    fixedMatches.length === 0 ||
    fixedMatches.some(
      (match) =>
        Math.abs(match.roundedHeightDifference) <= TARGET_TOLERANCE_MM &&
        Math.abs(match.roundedReachDifference) <= TARGET_TOLERANCE_MM
    )
  ) {
    return undefined;
  }

  const target = getTargetOffset(state);
  if (!target) {
    return undefined;
  }

  const matches: SetupMatch[] = [];
  for (const stem of ADJUSTABLE_STEM_LENGTHS) {
    for (const spacer of MATCH_SPACER_HEIGHTS) {
      const spacerRise = spacer * Math.sin((Math.PI / 180) * state.angleHt);
      const spacerRun = spacer * Math.cos((Math.PI / 180) * state.angleHt);
      const desiredInstalledAngle =
        (Math.atan2(target.rise - spacerRise, target.run + spacerRun) * 180) /
        Math.PI;
      const perpendicularToSteerer = 90 - state.angleHt;
      const orientation: StemOrientation =
        desiredInstalledAngle >= perpendicularToSteerer ? "up" : "flipped";
      const stemAngle =
        Math.round(
          Math.min(
            MAX_ADJUSTABLE_STEM_ANGLE,
            Math.abs(desiredInstalledAngle - perpendicularToSteerer)
          ) * 2
        ) / 2;
      const match = createSetupMatch(
        state,
        { stem, stemAngle, orientation, spacer },
        "adjustable"
      );
      if (match) matches.push(match);
    }
  }

  return matches.sort(compareMatches)[0];
};

export const isSameSetup = (a: StemSetup, b: StemSetup) =>
  a.stem === b.stem &&
  a.spacer === b.spacer &&
  a.stemAngle === b.stemAngle &&
  a.orientation === b.orientation;

export const isLoadedMatch = (state: FitState, match: SetupMatch) =>
  isSameSetup(state, match);

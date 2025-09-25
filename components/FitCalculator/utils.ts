import { FitState, NumericInput } from "./types";

export const getRadians = (angleDegrees: number): number => {
  return (Math.PI / 180) * angleDegrees;
};

export const calculateGeometry = (state: FitState) => {
  const flippedHeadtubeAngle = 90 + (90 - state.angleHt);
  const stemAngle = 180 - state.angleStem;

  const topOfHTX =
    state.stemXOrigin +
    Math.cos(getRadians(flippedHeadtubeAngle)) * state.spacer;
  const topOfHTY =
    state.stemYOrigin -
    Math.sin(getRadians(flippedHeadtubeAngle)) * state.spacer;

  const stemEndX = topOfHTX - Math.cos(getRadians(stemAngle)) * state.stem;
  const stemEndY = topOfHTY - Math.sin(getRadians(stemAngle)) * state.stem;

  const spacerRise = state.spacer * Math.sin(getRadians(state.angleHt));
  const spacerRun = state.spacer * Math.sin(getRadians(90 - state.angleHt));
  const stemRise = state.stem * Math.sin(getRadians(state.angleStem));
  const stemRun = state.stem * Math.sin(getRadians(90 - state.angleStem));

  const totalRise = spacerRise + stemRise;
  const totalRun = stemRun - spacerRun;

  return {
    flippedHeadtubeAngle,
    stemAngle,
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

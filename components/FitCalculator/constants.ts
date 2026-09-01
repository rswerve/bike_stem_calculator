import { FitState } from "./types";

export const INITIAL_FIT_STATE: FitState = {
  spacer: 40,
  stem: 100,
  angleHt: 73,
  stemAngle: 17,
  orientation: "flipped",
  stack: "",
  reach: "",
  handlebarStack: "",
  handlebarReach: "",
  name: "",
  reference: null,
};

export const TARGET_TOLERANCE_MM = 5;
export const TARGET_CLOSE_TOLERANCE_MM = TARGET_TOLERANCE_MM * 3;

export const STEM_LENGTHS = [50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150];
export const FIXED_STEM_ANGLES = [0, 6, 7, 8, 10, 17, 25, 30, 35];
export const MATCH_SPACER_HEIGHTS = [
  0, 5, 10, 15, 20, 25, 30, 35, 40,
];
export const ADJUSTABLE_STEM_LENGTHS = [90, 105, 120];
export const MAX_ADJUSTABLE_STEM_ANGLE = 55;

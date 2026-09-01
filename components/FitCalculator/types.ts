export type NumericInput = number | "";

export type StemOrientation = "up" | "flipped";

export interface StemSetup {
  spacer: number;
  stem: number;
  stemAngle: number;
  orientation: StemOrientation;
}

export interface FitState extends StemSetup {
  angleHt: number;
  stack: NumericInput;
  reach: NumericInput;
  handlebarStack: NumericInput;
  handlebarReach: NumericInput;
  name: string;
  reference: StemSetup | null;
}

export type FitReducerAction =
  | {
      type: "update";
      field: keyof FitState;
      value: FitState[keyof FitState];
    }
  | {
      type: "replace";
      payload: FitState;
    }
  | {
      type: "loadSetup";
      payload: StemSetup;
    };

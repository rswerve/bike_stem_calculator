export type NumericInput = number | "";

export interface FitState {
  stemXOrigin: number;
  stemYOrigin: number;
  spacer: number;
  stem: number;
  angleHt: number;
  angleStem: number;
  stack: NumericInput;
  reach: NumericInput;
  handlebarStack: NumericInput;
  handlebarReach: NumericInput;
  name: string;
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
    };

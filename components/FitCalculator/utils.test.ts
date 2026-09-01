import { expect } from "@jest/globals";

import { INITIAL_FIT_STATE } from "./constants";
import type { FitState } from "./types";
import {
  calculateGeometry,
  calculateReachDiff,
  calculateStackDiff,
  formatAxisDifference,
  formatDiffMessage,
  getInstalledStemAngle,
  getComparisonDrawOrder,
  getRadians,
  getTargetOffset,
  getTargetProximity,
  isFitTargetComplete,
  legacyAngleToSetup,
} from "./utils";

const stateWith = (overrides: Partial<FitState>): FitState => ({
  ...INITIAL_FIT_STATE,
  ...overrides,
});

describe("angle conversion", () => {
  it("converts degrees to radians", () => {
    expect(getRadians(90)).toBeCloseTo(Math.PI / 2, 12);
    expect(getRadians(-60)).toBeCloseTo(-Math.PI / 3, 12);
  });

  it("derives the installed angle from the printed angle and orientation", () => {
    expect(getInstalledStemAngle(73, 17, "flipped")).toBe(0);
    expect(getInstalledStemAngle(73, 6, "up")).toBe(23);
    expect(getInstalledStemAngle(73, 6, "flipped")).toBe(11);
  });

  it.each([
    [65, -60],
    [73, 0],
    [73, 37],
    [85, 60],
  ])("round-trips legacy angle %s/%s", (angleHt, installedAngle) => {
    const setup = legacyAngleToSetup(angleHt, installedAngle);
    expect(
      getInstalledStemAngle(angleHt, setup.stemAngle, setup.orientation)
    ).toBeCloseTo(installedAngle, 12);
  });
});

describe("calculateGeometry", () => {
  it("preserves the original default result", () => {
    const geometry = calculateGeometry(INITIAL_FIT_STATE);

    expect(geometry.totalRise).toBeCloseTo(38.2521902385, 6);
    expect(geometry.totalRun).toBeCloseTo(88.3051318111, 6);
    expect(Math.round(geometry.totalRise)).toBe(38);
    expect(Math.round(geometry.totalRun)).toBe(88);
  });

  it("uses coordinates relative to the top of the head tube", () => {
    const geometry = calculateGeometry(INITIAL_FIT_STATE);

    expect(geometry.topOfHTX).toBeCloseTo(-11.6948681889, 6);
    expect(geometry.topOfHTY).toBeCloseTo(-38.2521902385, 6);
    expect(geometry.stemEndX).toBeCloseTo(88.3051318111, 6);
    expect(geometry.stemEndY).toBeCloseTo(-38.2521902385, 6);
  });

  it("reproduces the real production legacy URL after migration", () => {
    const geometry = calculateGeometry(
      stateWith({
        spacer: 70,
        stem: 140,
        angleHt: 73,
        stemAngle: 20,
        orientation: "up",
      })
    );

    expect(geometry.installedStemAngle).toBe(37);
    expect(geometry.totalRise).toBeCloseTo(151.1954361587, 6);
    expect(geometry.totalRun).toBeCloseTo(91.342952076, 6);
  });

  it("changes the drawing and result when a fixed stem is flipped", () => {
    const up = calculateGeometry(
      stateWith({ stemAngle: 17, orientation: "up" })
    );
    const flipped = calculateGeometry(
      stateWith({ stemAngle: 17, orientation: "flipped" })
    );

    expect(up.totalRise).toBeGreaterThan(flipped.totalRise);
    expect(up.stemEndY).toBeLessThan(flipped.stemEndY);
  });

  it("subtracts spacer setback from stem run", () => {
    const geometry = calculateGeometry(INITIAL_FIT_STATE);
    expect(geometry.totalRun).toBeCloseTo(
      geometry.stemRun - geometry.spacerRun,
      12
    );
  });
});

describe("comparison drawing order", () => {
  const current = stateWith({
    spacer: 40,
    stem: 100,
    angleHt: 73,
    stemAngle: 17,
    orientation: "flipped",
  });
  const pinned = {
    spacer: 40,
    stem: 100,
    stemAngle: 17,
    orientation: "flipped" as const,
  };

  it("puts the shorter collinear stem on top in either direction", () => {
    expect(
      getComparisonDrawOrder({ ...current, stem: 110 }, pinned).stem
    ).toEqual(["current", "pinned"]);
    expect(
      getComparisonDrawOrder({ ...current, stem: 90 }, pinned).stem
    ).toEqual(["pinned", "current"]);
  });

  it("puts the shorter spacer on top and resolves ties to pinned", () => {
    expect(
      getComparisonDrawOrder({ ...current, spacer: 50 }, pinned).spacer
    ).toEqual(["current", "pinned"]);
    expect(
      getComparisonDrawOrder({ ...current, spacer: 30 }, pinned).spacer
    ).toEqual(["pinned", "current"]);
    expect(getComparisonDrawOrder(current, pinned).spacer).toEqual([
      "current",
      "pinned",
    ]);
  });

  it("keeps both stems intact when their start or installed angle differs", () => {
    const differentSpacer = getComparisonDrawOrder(
      { ...current, spacer: 50, stem: 110 },
      pinned
    );
    const differentAngle = getComparisonDrawOrder(
      { ...current, stem: 110, stemAngle: 6, orientation: "up" },
      pinned
    );

    expect(differentSpacer.stemsShareLine).toBe(false);
    expect(differentSpacer.stem).toEqual(["pinned", "current"]);
    expect(differentAngle.stemsShareLine).toBe(false);
    expect(differentAngle.stem).toEqual(["pinned", "current"]);
  });

  it("treats negligible installed-angle differences as the same line", () => {
    const order = getComparisonDrawOrder(
      { ...current, stemAngle: current.stemAngle + 1e-9 },
      pinned
    );

    expect(order.stemsShareLine).toBe(true);
    expect(order.stem).toEqual(["current", "pinned"]);
  });
});

describe("fit target", () => {
  const complete = stateWith({
    stack: 570,
    reach: 389,
    handlebarStack: 645,
    handlebarReach: 462,
  });

  it("is complete only when all four frame and target measurements are set", () => {
    expect(isFitTargetComplete(complete)).toBe(true);
    expect(isFitTargetComplete({ ...complete, handlebarReach: "" })).toBe(false);
    expect(isFitTargetComplete({ ...complete, stack: 0 })).toBe(false);
  });

  it("expresses the target relative to the top of the head tube", () => {
    expect(getTargetOffset(complete)).toEqual({ rise: 75, run: 73 });
    expect(getTargetOffset({ ...complete, reach: "" })).toBeUndefined();
  });

  it("calculates target differences from achieved geometry", () => {
    const geometry = calculateGeometry(INITIAL_FIT_STATE);
    expect(
      calculateStackDiff(complete, geometry.spacerRise, geometry.stemRise)
    ).toBe(37);
    expect(
      calculateReachDiff(complete, geometry.stemRun, geometry.spacerRun)
    ).toBe(-15);
  });
});

describe("difference labels", () => {
  it("labels rounded zero as exact", () => {
    expect(formatAxisDifference(0.49, "low", "high")).toBe("Exact");
    expect(formatAxisDifference(-0.49, "short", "long")).toBe("Exact");
  });

  it("labels each direction in whole millimetres", () => {
    expect(formatAxisDifference(-2.4, "low", "high")).toBe("2 mm low");
    expect(formatAxisDifference(2.6, "short", "long")).toBe("3 mm long");
  });

  it("keeps the sentence formatter for existing callers", () => {
    expect(formatDiffMessage(undefined, "HIGH", "LOW", "Height")).toBe("");
    expect(formatDiffMessage(0, "HIGH", "LOW", "Height")).toBe(
      "Height is JUST RIGHT"
    );
    expect(formatDiffMessage(-2, "HIGH", "LOW", "Height")).toBe(
      "Height is HIGH by 2mm"
    );
  });
});

describe("target proximity", () => {
  it.each([
    [0, "on-target"],
    [5.49, "on-target"],
    [5.5, "close"],
    [-15.49, "close"],
    [15.5, "far"],
  ] as const)("classifies a displayed difference of %s", (difference, result) => {
    expect(getTargetProximity(difference)).toBe(result);
  });
});

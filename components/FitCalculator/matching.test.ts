import { expect } from "@jest/globals";

import { INITIAL_FIT_STATE } from "./constants";
import {
  findAdjustableFallback,
  findFixedMatches,
  isLoadedMatch,
} from "./matching";
import type { FitState } from "./types";

const matchingState = (overrides: Partial<FitState> = {}): FitState => ({
  ...INITIAL_FIT_STATE,
  stack: 570,
  reach: 389,
  handlebarStack: 645,
  handlebarReach: 462,
  ...overrides,
});

describe("findFixedMatches", () => {
  it("enumerates every standard fixed configuration", () => {
    const matches = findFixedMatches(matchingState());

    expect(matches).toHaveLength(1683);
    expect(matches.some((match) => match.stem === 50)).toBe(true);
  });

  it("returns no rows until the frame and target are complete", () => {
    expect(findFixedMatches(matchingState({ handlebarReach: "" }))).toEqual([]);
  });

  it("sorts first by the whole-millimetre differences shown to the rider", () => {
    const matches = findFixedMatches(matchingState()).slice(0, 40);
    const displayedScores = matches.map(
      (match) =>
        match.roundedHeightDifference ** 2 + match.roundedReachDifference ** 2
    );

    expect(displayedScores).toEqual([...displayedScores].sort((a, b) => a - b));
  });

  it("prefers less spacer when two rows display the same difference", () => {
    const matches = findFixedMatches(matchingState());
    const repeatedDifference = matches.find((match, index) =>
      matches.slice(index + 1).some(
        (other) =>
          other.roundedHeightDifference === match.roundedHeightDifference &&
          other.roundedReachDifference === match.roundedReachDifference
      )
    );
    expect(repeatedDifference).toBeDefined();
    const tied = matches.filter(
      (match) =>
        match.roundedHeightDifference ===
          repeatedDifference?.roundedHeightDifference &&
        match.roundedReachDifference === repeatedDifference?.roundedReachDifference
    );

    expect(tied[0].spacer).toBeLessThanOrEqual(tied[1].spacer);
  });

  it("is independent of the setup currently loaded in the controls", () => {
    const first = findFixedMatches(matchingState()).slice(0, 5);
    const changed = findFixedMatches(
      matchingState({ spacer: 5, stem: 150, stemAngle: 40, orientation: "up" })
    ).slice(0, 5);

    expect(changed).toEqual(first);
  });

  it("uses explicit directional labels", () => {
    const match = findFixedMatches(matchingState())[0];
    expect(match.heightLabel).toMatch(/Exact|\d+ mm (low|high)/);
    expect(match.reachLabel).toMatch(/Exact|\d+ mm (short|long)/);
  });

  it("does not recommend more than 40 mm of spacer", () => {
    expect(
      Math.max(...findFixedMatches(matchingState()).map((match) => match.spacer))
    ).toBe(40);
  });
});

describe("adjustable fallback", () => {
  it("stays hidden when a fixed setup lands within five millimetres", () => {
    const state = matchingState();
    const fixed = findFixedMatches(state);
    expect(findAdjustableFallback(state, fixed)).toBeUndefined();
  });

  it("returns one adjustable setup for an unreachable fixed target", () => {
    const state = matchingState({ handlebarStack: 900, handlebarReach: 700 });
    const fixed = findFixedMatches(state);
    const fallback = findAdjustableFallback(state, fixed);

    expect(fallback).toMatchObject({ kind: "adjustable" });
    expect([90, 105, 120]).toContain(fallback?.stem);
    expect(fallback?.stemAngle).toBeGreaterThanOrEqual(0);
    expect(fallback?.stemAngle).toBeLessThanOrEqual(55);
  });

  it("finds a continuous-angle setup when fixed angles miss", () => {
    const state = matchingState({
      handlebarStack: 529.140855,
      handlebarReach: 469.190587,
    });
    const fixed = findFixedMatches(state);
    const fallback = findAdjustableFallback(state, fixed);

    expect(fallback).toMatchObject({
      stem: 90,
      stemAngle: 44,
      orientation: "flipped",
      spacer: 0,
    });
    expect(Math.abs(fallback?.roundedHeightDifference ?? 99)).toBeLessThanOrEqual(5);
    expect(Math.abs(fallback?.roundedReachDifference ?? 99)).toBeLessThanOrEqual(5);
  });
});

describe("isLoadedMatch", () => {
  it("compares all four setup controls", () => {
    const state = matchingState();
    const loaded = {
      ...state,
      kind: "fixed" as const,
      heightDifference: 0,
      reachDifference: 0,
      roundedHeightDifference: 0,
      roundedReachDifference: 0,
      heightLabel: "Exact",
      reachLabel: "Exact",
    };

    expect(isLoadedMatch(state, loaded)).toBe(true);
    expect(isLoadedMatch({ ...state, spacer: state.spacer + 1 }, loaded)).toBe(
      false
    );
  });
});

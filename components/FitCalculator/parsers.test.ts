import { expect } from "@jest/globals";

import { INITIAL_FIT_STATE } from "./constants";
import { createFitStateParser, fitStateParser } from "./parsers";
import type { FitState } from "./types";
import { calculateGeometry } from "./utils";

jest.mock("nuqs", () => ({
  createParser: jest.fn((options) => ({
    parse: (value: string | null) => options.parse(value),
    serialize: (value: FitState | null) => options.serialize(value),
  })),
}));

const baseState: FitState = {
  ...INITIAL_FIT_STATE,
  spacer: 10,
  stem: 80,
  stack: 520,
  reach: 400,
  handlebarStack: 540,
  handlebarReach: 410,
  name: "Baseline",
};

describe("fitStateParser", () => {
  it("round-trips the current state and pinned reference", () => {
    const state: FitState = {
      ...baseState,
      reference: {
        spacer: 35,
        stem: 110,
        stemAngle: 6,
        orientation: "flipped",
      },
    };

    expect(fitStateParser.parse(fitStateParser.serialize(state))).toEqual(state);
  });

  it("migrates the real production legacy angle without moving the cockpit", () => {
    const legacy = {
      stemXOrigin: 100,
      stemYOrigin: 200,
      spacer: 70,
      stem: 140,
      angleHt: 73,
      angleStem: 37,
      stack: 565,
      reach: 383,
      handlebarStack: 717,
      handlebarReach: 475,
      input: "angleStem",
      value: 37,
    };

    const parsed = fitStateParser.parse(JSON.stringify(legacy));
    expect(parsed).toMatchObject({ stemAngle: 20, orientation: "up" });

    const geometry = calculateGeometry(parsed as FitState);
    expect(geometry.totalRise).toBeCloseTo(151.1954361587, 6);
    expect(geometry.totalRun).toBeCloseTo(91.342952076, 6);
  });

  it("loads a copied legacy state after one extra URL-escaping layer", () => {
    const copiedValue =
      "{%22stemXOrigin%22:100,%22stemYOrigin%22:200,%22spacer%22:34,%22stem%22:110,%22angleHt%22:72,%22angleStem%22:22,%22stack%22:620,%22reach%22:403,%22handlebarStack%22:692,%22handlebarReach%22:494,%22name%22:%22%22}";

    expect(fitStateParser.parse(copiedValue)).toMatchObject({
      spacer: 34,
      stem: 110,
      angleHt: 72,
      stemAngle: 4,
      orientation: "up",
      stack: 620,
      reach: 403,
      handlebarStack: 692,
      handlebarReach: 494,
      name: "",
    });
  });

  it("migrates a horizontal legacy stem to a 17 degree flipped stem", () => {
    expect(
      fitStateParser.parse(JSON.stringify({ angleHt: 73, angleStem: 0 }))
    ).toMatchObject({ stemAngle: 17, orientation: "flipped" });
  });

  it("prefers the new angle fields when both formats are present", () => {
    expect(
      fitStateParser.parse(
        JSON.stringify({
          angleHt: 73,
          angleStem: 37,
          stemAngle: 6,
          orientation: "flipped",
        })
      )
    ).toMatchObject({ stemAngle: 6, orientation: "flipped" });
  });

  it("fills missing fields from the defaults", () => {
    expect(
      fitStateParser.parse(JSON.stringify({ spacer: 55, name: "Partial" }))
    ).toEqual({ ...INITIAL_FIT_STATE, spacer: 55, name: "Partial" });
  });

  it("keeps defaults for fields with invalid types", () => {
    expect(
      fitStateParser.parse(
        JSON.stringify({ stem: "invalid", orientation: "sideways", name: 42 })
      )
    ).toEqual(INITIAL_FIT_STATE);
  });

  it("drops obsolete and unknown fields", () => {
    const parsed = fitStateParser.parse(
      JSON.stringify({ stemXOrigin: 100, input: "spacer", value: 44 })
    );

    expect(parsed).not.toHaveProperty("stemXOrigin");
    expect(parsed).not.toHaveProperty("input");
    expect(parsed).not.toHaveProperty("value");
  });

  it("rejects an invalid pinned reference without rejecting the setup", () => {
    expect(
      fitStateParser.parse(
        JSON.stringify({ spacer: 50, reference: { stem: "bad" } })
      )
    ).toEqual({ ...INITIAL_FIT_STATE, spacer: 50, reference: null });
  });

  it("preserves valid values outside the current controls", () => {
    expect(
      fitStateParser.parse(
        JSON.stringify({ stem: 200, stemAngle: 77, orientation: "up" })
      )
    ).toMatchObject({ stem: 200, stemAngle: 77, orientation: "up" });
  });

  it("preserves empty optional measurements", () => {
    expect(
      fitStateParser.parse(JSON.stringify({ ...baseState, stack: "" }))?.stack
    ).toBe("");
  });

  it("returns null for absent and non-object values", () => {
    expect(fitStateParser.parse(null)).toBeNull();
    expect(fitStateParser.parse("42")).toBeNull();
    expect(fitStateParser.parse('"text"')).toBeNull();
  });

  it("uses the requested fallback after invalid JSON", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const fallback = { ...baseState, name: "Fallback" };
    const parser = createFitStateParser({ fallback });

    expect(parser.parse("not-json")).toBe(fallback);
    expect(warn).toHaveBeenCalled();
  });

  it("serializes null as null", () => {
    expect(fitStateParser.serialize(null)).toBeNull();
  });
});

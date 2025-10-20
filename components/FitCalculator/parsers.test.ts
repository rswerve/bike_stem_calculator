import { expect } from "@jest/globals";
import { FitState } from "./types";
import { INITIAL_FIT_STATE } from "./constants";
import { createFitStateParser, fitStateParser } from "./parsers";

jest.mock("nuqs", () => ({
  createParser: jest.fn((options) => ({
    parse: (value: string | null) => options.parse(value),
    serialize: (value: FitState | null) => options.serialize(value),
  })),
}));

describe("fitStateParser", () => {
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

  it("parses valid JSON payloads", () => {
    const serialized = JSON.stringify(baseState);
    expect(fitStateParser.parse(serialized)).toEqual(baseState);
  });

  it("returns null for invalid structures", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const payload = JSON.stringify({ ...baseState, stem: "invalid" });

    expect(fitStateParser.parse(payload)).toBeNull();
    warnSpy.mockRestore();
  });

  it("falls back when parsing fails", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const fallback = { ...baseState, name: "Fallback" };
    const parser = createFitStateParser({ fallback });

    expect(parser.parse("not-json")).toBe(fallback);
    warnSpy.mockRestore();
  });

  it("serializes state objects", () => {
    const payload = fitStateParser.serialize(baseState);
    expect(payload).toBe(JSON.stringify(baseState));
  });

  it("parses old format without name field (backward compatibility)", () => {
    // Old format had extra fields (input, value) and no name field
    const oldFormat = {
      stemXOrigin: 100,
      stemYOrigin: 200,
      spacer: 44,
      stem: 120,
      angleHt: 73,
      angleStem: 23,
      stack: 601,
      reach: 396,
      handlebarStack: 692,
      handlebarReach: 494,
      input: "spacer", // old field, should be ignored
      value: 44, // old field, should be ignored
    };

    const serialized = JSON.stringify(oldFormat);
    const parsed = fitStateParser.parse(serialized);

    expect(parsed).not.toBeNull();
    expect(parsed).toMatchObject({
      stemXOrigin: 100,
      stemYOrigin: 200,
      spacer: 44,
      stem: 120,
      angleHt: 73,
      angleStem: 23,
      stack: 601,
      reach: 396,
      handlebarStack: 692,
      handlebarReach: 494,
      name: "", // default name for old format
    });
  });

  it("handles partial states with missing fields", () => {
    // URL with only some fields present - should fill in defaults for missing ones
    const partialFormat = {
      spacer: 50,
      stem: 110,
      name: "Partial Config",
    };

    const serialized = JSON.stringify(partialFormat);
    const parsed = fitStateParser.parse(serialized);

    expect(parsed).not.toBeNull();
    expect(parsed).toMatchObject({
      // Provided fields
      spacer: 50,
      stem: 110,
      name: "Partial Config",
      // Default fields from INITIAL_FIT_STATE
      stemXOrigin: INITIAL_FIT_STATE.stemXOrigin,
      stemYOrigin: INITIAL_FIT_STATE.stemYOrigin,
      angleHt: INITIAL_FIT_STATE.angleHt,
      angleStem: INITIAL_FIT_STATE.angleStem,
      stack: INITIAL_FIT_STATE.stack,
      reach: INITIAL_FIT_STATE.reach,
      handlebarStack: INITIAL_FIT_STATE.handlebarStack,
      handlebarReach: INITIAL_FIT_STATE.handlebarReach,
    });
  });

  it("ignores invalid field types and uses defaults", () => {
    const mixedFormat = {
      spacer: "not-a-number", // invalid type
      stem: 90, // valid
      angleHt: null, // invalid type
      name: 123, // invalid type
    };

    const serialized = JSON.stringify(mixedFormat);
    const parsed = fitStateParser.parse(serialized);

    expect(parsed).not.toBeNull();
    expect(parsed).toMatchObject({
      stem: 90, // valid field is used
      spacer: INITIAL_FIT_STATE.spacer, // invalid field uses default
      angleHt: INITIAL_FIT_STATE.angleHt, // invalid field uses default
      name: INITIAL_FIT_STATE.name, // invalid field uses default
    });
  });
});

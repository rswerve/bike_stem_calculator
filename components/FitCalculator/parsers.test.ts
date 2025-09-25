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
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect } from "@jest/globals";
import * as nuqs from "nuqs";

import FitCalculator from "./FitCalculator";
import type { FitState } from "./types";

type SetFitQueryState = (
  value: FitState | null | ((old: FitState | null) => FitState | null),
  options?: unknown
) => Promise<URLSearchParams>;

type FitQueryState = [FitState | null, SetFitQueryState];

const mockSetQueryState = jest.fn<
  ReturnType<SetFitQueryState>,
  Parameters<SetFitQueryState>
>(() => Promise.resolve(new URLSearchParams()));

const useQueryStateMock: jest.Mock<FitQueryState, [string, unknown?]> =
  jest.fn();

jest.mock("nuqs", () => {
  const actual = jest.requireActual("nuqs");

  return {
    __esModule: true,
    ...actual,
    useQueryState: useQueryStateMock,
  };
});

const getFrameStackInput = () =>
  screen.getAllByLabelText(/stack/i, {
    selector: "input",
  })[0] as HTMLInputElement;

const getSlider = (name: string | RegExp) =>
  screen.getByRole("slider", { name }) as HTMLInputElement;

const parsedStateFixture: FitState = {
  stemXOrigin: 123,
  stemYOrigin: 456,
  spacer: 62,
  stem: 120,
  angleHt: 73,
  angleStem: 0,
  stack: "",
  reach: "",
  handlebarStack: "",
  handlebarReach: "",
  name: "Loaded from URL",
};

beforeEach(() => {
  mockSetQueryState.mockClear();
  useQueryStateMock.mockReset();
  useQueryStateMock.mockReturnValue([null, mockSetQueryState]);
});

afterEach(() => {
  jest.restoreAllMocks();
});

it("renders and syncs inputs to query state", async () => {
  const user = userEvent.setup();

  render(<FitCalculator />);

  expect(screen.getByRole("heading", { name: /frame/i })).not.toBeNull();

  const frameStackInput = getFrameStackInput();
  await user.type(frameStackInput, "45");

  expect(frameStackInput.value).toBe("45");
  expect(mockSetQueryState).toHaveBeenCalled();
});

it("hydrates state from url query", () => {
  useQueryStateMock.mockReturnValueOnce([
    parsedStateFixture,
    mockSetQueryState,
  ]);

  render(<FitCalculator />);

  expect(screen.getByDisplayValue("Loaded from URL")).toBeDefined();
  expect(getSlider(/spacer/i).valueAsNumber).toBe(parsedStateFixture.spacer);
  expect(getSlider(/stem slider/i).valueAsNumber).toBe(parsedStateFixture.stem);
  expect(getSlider(/angleht slider/i).valueAsNumber).toBe(
    parsedStateFixture.angleHt
  );
  expect(getSlider(/anglestem slider/i).valueAsNumber).toBe(
    parsedStateFixture.angleStem
  );
});

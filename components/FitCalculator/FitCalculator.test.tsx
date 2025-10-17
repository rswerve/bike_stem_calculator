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

// Create a mock that can be accessed after jest.mock() hoisting
let useQueryStateMock: jest.Mock<FitQueryState, [string, unknown?]>;

jest.mock("nuqs", () => {
  const actual = jest.requireActual("nuqs");
  const mockFn = jest.fn();
  
  // Assign to the outer variable so tests can access it
  useQueryStateMock = mockFn as jest.Mock<FitQueryState, [string, unknown?]>;

  return {
    __esModule: true,
    ...actual,
    useQueryState: mockFn,
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

it("hydrates state from url query on initial render", () => {
  // Mock useQueryState to return the parsed state BEFORE render
  useQueryStateMock.mockReturnValue([parsedStateFixture, mockSetQueryState]);

  const { container } = render(<FitCalculator />);

  // Check that the name field has the loaded value
  const nameInput = screen.getByDisplayValue("Loaded from URL");
  expect(nameInput).toBeDefined();

  // Check that sliders have the loaded values
  const spacerSlider = getSlider(/spacer/i);
  expect(spacerSlider.valueAsNumber).toBe(62);

  const stemSlider = getSlider(/stem slider/i);
  expect(stemSlider.valueAsNumber).toBe(120);

  const angleHtSlider = getSlider(/angleht slider/i);
  expect(angleHtSlider.valueAsNumber).toBe(73);

  const angleStemSlider = getSlider(/anglestem slider/i);
  expect(angleStemSlider.valueAsNumber).toBe(0);

  // Verify the mock was called with the right key
  expect(useQueryStateMock).toHaveBeenCalledWith("urlstate", expect.anything());
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect } from "@jest/globals";

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

const mockUseQueryState = jest.fn<FitQueryState, [string, unknown?]>();

jest.mock("nuqs", () => {
  const actual = jest.requireActual("nuqs");

  return {
    __esModule: true,
    ...actual,
    useQueryState: (...args: any[]) => mockUseQueryState(...args),
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
  mockUseQueryState.mockReset();
  mockUseQueryState.mockReturnValue([null, mockSetQueryState]);
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
  mockUseQueryState.mockReturnValue([parsedStateFixture, mockSetQueryState]);

  render(<FitCalculator />);

  // Check that the name field has the loaded value
  const nameInput = screen.getByDisplayValue("Loaded from URL");
  expect(nameInput).toBeDefined();

  // Check that sliders have the loaded values (aria-labels use underscores)
  const spacerSlider = getSlider("spacer_slider");
  expect(spacerSlider.valueAsNumber).toBe(62);

  const stemSlider = getSlider("stem_slider");
  expect(stemSlider.valueAsNumber).toBe(120);

  const angleHtSlider = getSlider("angleht_slider");
  expect(angleHtSlider.valueAsNumber).toBe(73);

  const angleStemSlider = getSlider("anglestem_slider");
  expect(angleStemSlider.valueAsNumber).toBe(0);

  // Verify the mock was called with the right key
  expect(mockUseQueryState).toHaveBeenCalledWith("urlstate", expect.anything());
});

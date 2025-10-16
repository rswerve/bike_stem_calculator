import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as nuqs from "nuqs";
import type { UseQueryStateReturn } from "nuqs";
import type { FitState } from "./types";

import FitCalculator from "./FitCalculator";

type SetQueryState = UseQueryStateReturn<FitState | null, undefined>[1];

const mockSetQueryState: jest.MockedFunction<SetQueryState> = jest.fn(() =>
  Promise.resolve(new URLSearchParams())
);

jest.mock("nuqs", () => {
  const actual = jest.requireActual("nuqs");

  return {
    __esModule: true,
    ...actual,
    useQueryState: jest.fn(
      () => [null, mockSetQueryState] as UseQueryStateReturn<FitState | null, undefined>
    ),
  };
});

describe("FitCalculator", () => {
  beforeEach(() => {
    mockSetQueryState.mockClear();
  });

  it("renders and syncs inputs to query state", async () => {
    const user = userEvent.setup();

    render(<FitCalculator />);

    const frameHeading = screen.getByRole("heading", { name: /frame/i });
    expect(frameHeading).toBeDefined();

    const [frameStackInput] = screen.getAllByLabelText(/stack/i, {
      selector: "input",
    });
    await user.type(frameStackInput, "45");

    expect((frameStackInput as HTMLInputElement).value).toBe("45");
    expect(mockSetQueryState).toHaveBeenCalled();
  });

  it("hydrates state from url query", () => {
    const parsedState = {
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

    jest
      .spyOn(nuqs, "useQueryState")
      .mockReturnValueOnce([parsedState, mockSetQueryState]);

    render(<FitCalculator />);

    expect(screen.getByDisplayValue("Loaded from URL")).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: /spacer/i })).toHaveValue(
      parsedState.spacer
    );
    expect(screen.getByRole("slider", { name: /stem slider/i })).toHaveValue(
      parsedState.stem
    );
    expect(screen.getByRole("slider", { name: /angleht slider/i })).toHaveValue(
      parsedState.angleHt
    );
    expect(
      screen.getByRole("slider", { name: /anglestem slider/i })
    ).toHaveValue(parsedState.angleStem);
  });
});

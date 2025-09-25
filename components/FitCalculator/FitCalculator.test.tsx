import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as nuqs from "nuqs";
import { expect } from "@jest/globals";

import FitCalculator from "./FitCalculator";

const mockSetQueryState = jest.fn();

jest.mock("nuqs", () => ({
  createParser: jest.fn((options) => options),
  useQueryState: jest.fn(() => [null, mockSetQueryState]),
}));

describe("FitCalculator", () => {
  beforeEach(() => {
    mockSetQueryState.mockClear();
  });

  it("renders default headers", async () => {
    const user = userEvent.setup();

    render(<FitCalculator />);

    expect(screen.getByText(/Bicycle Stem & Fit Calculator/i)).toBeTruthy();

    const spacerSlider = screen.getByRole("slider", { name: /spacer/i });
    await user.click(spacerSlider);

    expect(spacerSlider).toBeTruthy();
    expect(mockSetQueryState).toHaveBeenCalled();
  });
});

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
});

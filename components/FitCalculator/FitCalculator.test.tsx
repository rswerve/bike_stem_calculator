import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { INITIAL_FIT_STATE } from "./constants";
import FitCalculator from "./FitCalculator";
import type { FitState } from "./types";

type SetFitQueryState = (
  value: FitState | null | ((old: FitState | null) => FitState | null),
  options?: unknown
) => Promise<URLSearchParams>;

const mockSetQueryState = jest.fn<
  ReturnType<SetFitQueryState>,
  Parameters<SetFitQueryState>
>(() => Promise.resolve(new URLSearchParams()));
const mockUseQueryState = jest.fn<
  [FitState | null, SetFitQueryState],
  [string, unknown?]
>();

jest.mock("nuqs", () => ({
  __esModule: true,
  createParser: (options: {
    parse: (value: string | null) => FitState | null;
    serialize: (value: FitState | null) => string | null;
  }) => ({
    parse: (value: string | null) => options.parse(value),
    serialize: (value: FitState | null) => options.serialize(value),
  }),
  useQueryState: (...args: Parameters<typeof mockUseQueryState>) =>
    mockUseQueryState(...args),
}));

const stateWith = (overrides: Partial<FitState>): FitState => ({
  ...INITIAL_FIT_STATE,
  ...overrides,
});

const seedState = (state: FitState) => {
  window.history.replaceState(
    {},
    "",
    `/?urlstate=${encodeURIComponent(JSON.stringify(state))}`
  );
  mockUseQueryState.mockReturnValue([state, mockSetQueryState]);
};

const seedRawState = (state: Record<string, unknown>) => {
  window.history.replaceState(
    {},
    "",
    `/?urlstate=${encodeURIComponent(JSON.stringify(state))}`
  );
  mockUseQueryState.mockReturnValue([null, mockSetQueryState]);
};

const slider = (name: string) =>
  screen.getByRole("slider", { name }) as HTMLInputElement;

const controlValue = (name: string) =>
  screen.getByRole("textbox", { name: `${name} value` }) as HTMLInputElement;

const matchRows = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll<HTMLButtonElement>("button.matchRow")
  );

const lineCoords = (container: HTMLElement, label: string) => {
  const line = container.querySelector(`line[aria-label="${label}"]`);
  if (!line) throw new Error(`Missing SVG line: ${label}`);

  return {
    x1: Number(line.getAttribute("x1")),
    y1: Number(line.getAttribute("y1")),
    x2: Number(line.getAttribute("x2")),
    y2: Number(line.getAttribute("y2")),
  };
};

beforeEach(() => {
  mockSetQueryState.mockClear();
  mockUseQueryState.mockReset();
  mockUseQueryState.mockReturnValue([null, mockSetQueryState]);
  window.history.replaceState({}, "", "/");
});

afterEach(() => {
  jest.restoreAllMocks();
  window.history.replaceState({}, "", "/");
});

describe("direct calculator", () => {
  it("preserves the original default result", () => {
    render(<FitCalculator />);

    expect(screen.getByText("+38")).toBeDefined();
    expect(screen.getByText("+88")).toBeDefined();
    expect(screen.getByText("From the head tube top")).toBeDefined();
  });

  it("starts with the migrated default controls", () => {
    render(<FitCalculator />);

    expect(slider("Spacer stack").valueAsNumber).toBe(40);
    expect(slider("Stem length").valueAsNumber).toBe(100);
    expect(slider("Printed stem angle").valueAsNumber).toBe(17);
    expect(slider("Head tube angle").valueAsNumber).toBe(73);
    expect(screen.getByRole("button", { name: /flipped/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("redraws and recomputes on the same change event", () => {
    const { container } = render(<FitCalculator />);
    const before = lineCoords(container, "spacer stack");

    fireEvent.change(slider("Spacer stack"), { target: { value: "60" } });

    expect(screen.getByText("+57")).toBeDefined();
    expect(lineCoords(container, "spacer stack").y2).not.toBe(before.y2);
  });

  it("keeps an editable value, slider, and drawing synchronized", () => {
    const { container } = render(<FitCalculator />);
    const before = lineCoords(container, "stem");

    fireEvent.change(controlValue("Stem length"), {
      target: { value: "120" },
    });

    expect(slider("Stem length").valueAsNumber).toBe(120);
    expect(lineCoords(container, "stem").x2).not.toBe(before.x2);

    fireEvent.blur(controlValue("Stem length"));
    fireEvent.change(slider("Stem length"), { target: { value: "130" } });
    expect(controlValue("Stem length")).toHaveValue("130");
  });

  it("restores the current value when an edited value is incomplete", () => {
    render(<FitCalculator />);
    const stemValue = controlValue("Stem length");

    fireEvent.focus(stemValue);
    fireEvent.change(stemValue, { target: { value: "" } });
    expect(slider("Stem length").valueAsNumber).toBe(100);

    fireEvent.blur(stemValue);
    expect(stemValue).toHaveValue("100");
  });

  it("preserves off-grid values and steps from the typed value", () => {
    render(<FitCalculator />);
    const stemValue = controlValue("Stem length");

    fireEvent.focus(stemValue);
    fireEvent.change(stemValue, { target: { value: "95" } });

    expect(slider("Stem length")).toHaveValue("95");
    expect(slider("Stem length")).toHaveAttribute("step", "any");

    fireEvent.keyDown(stemValue, { key: "ArrowUp" });
    expect(stemValue).toHaveValue("105");
    expect(slider("Stem length")).toHaveValue("105");
  });

  it("expands slider bounds when a typed value is committed", () => {
    render(<FitCalculator />);
    const stemValue = controlValue("Stem length");
    const spacerValue = controlValue("Spacer stack");

    fireEvent.focus(stemValue);
    fireEvent.change(stemValue, { target: { value: "40" } });
    expect(slider("Stem length")).toHaveAttribute("min", "40");
    expect(slider("Stem length")).toHaveValue("40");
    fireEvent.blur(stemValue);
    expect(slider("Stem length")).toHaveAttribute("min", "40");
    expect(slider("Stem length")).toHaveValue("40");

    fireEvent.focus(spacerValue);
    fireEvent.change(spacerValue, { target: { value: "200" } });
    expect(slider("Spacer stack")).toHaveAttribute("max", "200");
    expect(slider("Spacer stack")).toHaveValue("200");
    fireEvent.blur(spacerValue);
    expect(slider("Spacer stack")).toHaveAttribute("max", "200");
    expect(slider("Spacer stack")).toHaveValue("200");
  });

  it("shows the installed angle and redraws when the stem is flipped", () => {
    const { container } = render(<FitCalculator />);
    const before = lineCoords(container, "stem");

    fireEvent.click(screen.getByRole("button", { name: /^up/i }));

    expect(screen.getByText("34° above horizontal")).toBeDefined();
    expect(lineCoords(container, "stem").y2).toBeLessThan(before.y2);
  });

  it("keeps one millimetre coordinate system while controls move", () => {
    const { container } = render(<FitCalculator />);
    const drawing = screen.getByRole("img", { name: /stem and spacer/i });
    const viewBox = drawing.getAttribute("viewBox");

    fireEvent.change(slider("Stem length"), { target: { value: "150" } });

    expect(drawing.getAttribute("viewBox")).toBe(viewBox);
    expect(lineCoords(container, "stem").x2).toBeCloseTo(138.3051, 3);
  });
});

describe("saved links", () => {
  it("loads the current printed-angle format", () => {
    seedState(
      stateWith({
        spacer: 35,
        stem: 110,
        stemAngle: 6,
        orientation: "up",
        name: "Road setup",
      })
    );

    render(<FitCalculator />);

    expect(slider("Spacer stack").valueAsNumber).toBe(35);
    expect(slider("Stem length").valueAsNumber).toBe(110);
    expect(slider("Printed stem angle").valueAsNumber).toBe(6);
    expect(screen.getByRole("button", { name: /^up/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByDisplayValue("Road setup")).toBeDefined();
  });

  it("loads the real production legacy link at identical geometry", () => {
    seedRawState({
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
    });

    render(<FitCalculator />);

    expect(slider("Printed stem angle").valueAsNumber).toBe(20);
    expect(screen.getByRole("button", { name: /^up/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByText("+151")).toBeDefined();
    expect(screen.getByText("+91")).toBeDefined();
  });

  it("holds an expanded legacy range while its slider moves", () => {
    seedRawState({
      spacer: 200,
      stem: 140,
      angleHt: 73,
      angleStem: 60,
    });
    render(<FitCalculator />);
    const spacers = slider("Spacer stack");

    expect(spacers.max).toBe("200");
    expect(controlValue("Spacer stack")).toHaveValue("200");
    fireEvent.change(spacers, { target: { value: "120" } });
    expect(spacers.max).toBe("200");
    fireEvent.change(spacers, { target: { value: "200" } });
    expect(spacers.valueAsNumber).toBe(200);
  });

  it("expands a saved link below the standard stem range", () => {
    seedRawState({ stem: 40 });
    render(<FitCalculator />);

    expect(slider("Stem length")).toHaveAttribute("min", "40");
    expect(slider("Stem length")).toHaveValue("40");
    expect(controlValue("Stem length")).toHaveValue("40");
  });

  it("writes the new angle format and comparison setup to the URL state", async () => {
    render(<FitCalculator />);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Pin this setup and compare a new one",
      })
    );
    fireEvent.change(slider("Printed stem angle"), { target: { value: "6" } });

    await waitFor(() => {
      expect(mockSetQueryState).toHaveBeenLastCalledWith(
        expect.objectContaining({
          stemAngle: 6,
          orientation: "flipped",
          reference: {
            spacer: 40,
            stem: 100,
            stemAngle: 17,
            orientation: "flipped",
          },
        })
      );
    });
  });
});

describe("comparing setups", () => {
  it("shows both setup geometries and switches the big numbers to differences", () => {
    const { container } = render(<FitCalculator />);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Pin this setup and compare a new one",
      })
    );

    expect(screen.getByText("100 mm · 17° flipped · 40 mm spacers")).toBeDefined();
    expect(
      container.querySelector('[data-setup="pinned"][data-segment="stem"]')
    ).not.toBeNull();
    expect(
      container.querySelector('[data-setup="current"][data-segment="stem"]')
    ).not.toBeNull();
    expect(screen.getAllByText("0")).toHaveLength(2);

    fireEvent.change(slider("Stem length"), { target: { value: "110" } });

    expect(screen.getByText("+10")).toBeDefined();
    expect(
      screen.getByText(
        "Change in handlebar height and reach from the setup named above."
      )
    ).toBeDefined();
  });

  it("clears the comparison without changing the current setup", () => {
    render(<FitCalculator />);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Pin this setup and compare a new one",
      })
    );
    fireEvent.change(slider("Stem length"), { target: { value: "110" } });
    fireEvent.click(screen.getByRole("button", { name: "Stop comparing" }));

    expect(slider("Stem length").valueAsNumber).toBe(110);
    expect(screen.getByText("From the head tube top")).toBeDefined();
  });
});

describe("frame and fit inputs", () => {
  it("links to the HX and HY explanation", () => {
    render(<FitCalculator />);

    expect(screen.getByRole("link", { name: "This article" })).toHaveAttribute(
      "href",
      "https://web.archive.org/web/20200809061637/https://www.slowtwitch.com/Bike_Fit/The_Secret_Weapon_of_Superstar_Fitters_HX_6335.html"
    );
  });

  it("accepts decimal measurements without disabling another field", async () => {
    const user = userEvent.setup();
    render(<FitCalculator />);

    await user.type(screen.getByRole("textbox", { name: "stack" }), "570.5");
    await user.type(screen.getByRole("textbox", { name: "reach" }), "389");

    expect(screen.getByRole("textbox", { name: "stack" })).toHaveValue("570.5");
    expect(screen.getByRole("textbox", { name: "reach" })).toHaveValue("389");
    expect(screen.queryByText("Enter a positive number")).toBeNull();
  });

  it("shows an error locally and leaves other inputs usable", async () => {
    const user = userEvent.setup();
    render(<FitCalculator />);

    await user.type(screen.getByRole("textbox", { name: "stack" }), "x");
    await user.type(screen.getByRole("textbox", { name: "reach" }), "389");

    expect(screen.getByText("Enter a positive number")).toBeDefined();
    expect(screen.getByRole("textbox", { name: "reach" })).toHaveValue("389");
  });

  it("hides stale matches when a completed measurement becomes invalid", () => {
    seedState(
      stateWith({
        stack: 570,
        reach: 389,
        handlebarStack: 645,
        handlebarReach: 462,
      })
    );
    render(<FitCalculator />);

    fireEvent.change(screen.getByRole("textbox", { name: "stack" }), {
      target: { value: "not a number" },
    });

    expect(
      screen.getByText("Add frame stack to see matching setups.")
    ).toBeDefined();
  });

  it("rejects a number too large for geometry calculations", () => {
    render(<FitCalculator />);

    fireEvent.change(screen.getByRole("textbox", { name: "stack" }), {
      target: { value: "9".repeat(400) },
    });

    expect(screen.getByText("Enter a smaller number")).toBeDefined();
  });

  it("labels HY and HX as bottom-bracket measurements", () => {
    render(<FitCalculator />);

    expect(screen.getByText("HY · handlebar height")).toBeDefined();
    expect(screen.getByText("HX · handlebar reach")).toBeDefined();
    expect(screen.getAllByText("Measured from the bottom bracket")).toHaveLength(2);
  });
});

describe("matching setups", () => {
  const completeState = stateWith({
    stack: 570,
    reach: 389,
    handlebarStack: 645,
    handlebarReach: 462,
  });

  it("explains what is missing before showing a table", () => {
    render(<FitCalculator />);
    expect(
      screen.getByText(
        "Add frame stack, frame reach, HY, and HX to see matching setups."
      )
    ).toBeDefined();
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(
      screen.queryByText("Enter all four measurements to see matching setups.")
    ).toBeNull();
  });

  it("updates the prompt as measurements are entered", () => {
    render(<FitCalculator />);

    fireEvent.change(screen.getByRole("textbox", { name: "stack" }), {
      target: { value: "570" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "reach" }), {
      target: { value: "389" },
    });

    expect(
      screen.getByText("Add HY and HX to see matching setups.")
    ).toBeDefined();
  });

  it("shows the current setup above five well-labelled fixed matches", () => {
    seedState(completeState);
    const { container } = render(<FitCalculator />);

    expect(screen.getAllByText("Stem length")).toHaveLength(2);
    expect(screen.getByText("Stem angle")).toBeDefined();
    expect(screen.getByText("Height vs target")).toBeDefined();
    expect(screen.getByText("Reach vs target")).toBeDefined();
    expect(matchRows(container)).toHaveLength(6);
    expect(matchRows(container)[0]).toHaveAccessibleName(/Original setup/);
    expect(matchRows(container)[0].getAttribute("aria-label")).toMatch(
      /Stem \d+ mm, angle .* spacers \d+ mm, height .* reach/
    );
    expect(matchRows(container)[0].textContent).toMatch(
      /\d+ mm.*°.*\d+ mm.*(Exact|\d+ mm (low|high)).*(Exact|\d+ mm (short|long))/
    );
  });

  it("loads a row without reordering the visible matches", () => {
    seedState(completeState);
    const { container } = render(<FitCalculator />);
    const before = matchRows(container).map((row) =>
      row.textContent?.replace("Loaded", "")
    );
    const selected = matchRows(container)[1];

    fireEvent.click(selected);

    expect(
      matchRows(container).map((row) =>
        row.textContent?.replace("Loaded", "")
      )
    ).toEqual(before);
    expect(matchRows(container)[1]).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(matchRows(container)[0]);

    expect(slider("Spacer stack").valueAsNumber).toBe(40);
    expect(slider("Stem length").valueAsNumber).toBe(100);
    expect(slider("Printed stem angle").valueAsNumber).toBe(17);
    expect(matchRows(container)[0]).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps the same matches while direct controls are explored", () => {
    seedState(completeState);
    const { container } = render(<FitCalculator />);
    const before = matchRows(container).map((row) => row.textContent);

    fireEvent.change(slider("Spacer stack"), { target: { value: "15" } });
    fireEvent.change(slider("Stem length"), { target: { value: "130" } });

    expect(matchRows(container).map((row) => row.textContent)).toEqual(before);
  });

  it("offers an adjustable fallback when it reaches the tolerance", () => {
    seedState(
      stateWith({
        stack: 570,
        reach: 389,
        handlebarStack: 529.140855,
        handlebarReach: 469.190587,
      })
    );

    render(<FitCalculator />);

    expect(screen.getByText("Adjustable stem fallback")).toBeDefined();
    expect(screen.getByRole("button", { name: "Load setup" })).toBeDefined();
  });

  it("calls out a target that fixed and adjustable stems cannot reach", () => {
    seedState(
      stateWith({
        stack: 570,
        reach: 389,
        handlebarStack: 900,
        handlebarReach: 700,
      })
    );

    render(<FitCalculator />);

    expect(screen.getByText("Target outside common range")).toBeDefined();
    expect(
      screen.getByText(/Neither the fixed stems above nor an adjustable stem/)
    ).toBeDefined();
    expect(screen.queryByRole("button", { name: "Load setup" })).toBeNull();
  });
});

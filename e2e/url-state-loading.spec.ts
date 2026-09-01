import { expect, test, type Page } from "@playwright/test";

const REAL_PRODUCTION_URL =
  "/?urlstate=%7B%22stemXOrigin%22%3A100%2C%22stemYOrigin%22%3A200%2C%22spacer%22%3A70%2C%22stem%22%3A140%2C%22angleHt%22%3A73%2C%22angleStem%22%3A37%2C%22stack%22%3A565%2C%22reach%22%3A383%2C%22handlebarStack%22%3A717%2C%22handlebarReach%22%3A475%2C%22input%22%3A%22angleStem%22%2C%22value%22%3A37%7D";

const DOUBLE_ESCAPED_COPIED_URL =
  "/?urlstate=%7B%2522stemXOrigin%2522:100,%2522stemYOrigin%2522:200,%2522spacer%2522:34,%2522stem%2522:110,%2522angleHt%2522:72,%2522angleStem%2522:22,%2522stack%2522:620,%2522reach%2522:403,%2522handlebarStack%2522:692,%2522handlebarReach%2522:494,%2522name%2522:%2522%2522%7D";

const withState = (state: Record<string, unknown>) =>
  `/?urlstate=${encodeURIComponent(JSON.stringify(state))}`;

const completeState = {
  spacer: 40,
  stem: 100,
  stemAngle: 17,
  orientation: "flipped",
  angleHt: 73,
  stack: 570,
  reach: 389,
  handlebarStack: 645,
  handlebarReach: 462,
  name: "",
  reference: null,
};

const readUrlState = (page: Page): Record<string, unknown> | null => {
  const raw = new URL(page.url()).searchParams.get("urlstate");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const captureBrowserProblems = (page: Page) => {
  const messages: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") messages.push(message.text());
  });
  page.on("pageerror", (error) => messages.push(error.message));
  return () => messages;
};

const slider = (page: Page, name: string) =>
  page.getByRole("slider", { name });

const controlValue = (page: Page, name: string) =>
  page.getByRole("textbox", { name: `${name} value` });

const matchRows = (page: Page) =>
  page
    .locator('section[aria-labelledby="matches-title"]')
    .locator('button[aria-pressed]');

const rowTexts = async (page: Page) =>
  (await matchRows(page).allTextContents()).map((text) =>
    text.replace("Loaded", "").trim()
  );

const relativeLuminance = (hex: string) => {
  const normalized = hex.trim().slice(1);
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((channel) => `${channel}${channel}`)
          .join("")
      : normalized;
  const channels = expanded
    .match(/.{2}/g)
    ?.map((channel) => Number.parseInt(channel, 16) / 255);
  if (!channels || channels.length !== 3) return Number.NaN;

  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  );
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
};

const contrastRatio = (first: string, second: string) => {
  const luminances = [relativeLuminance(first), relativeLuminance(second)].sort(
    (a, b) => b - a
  );
  return (luminances[0] + 0.05) / (luminances[1] + 0.05);
};

test.describe("bike stem calculator", () => {
  test.beforeEach(async ({ page }) => {
    // A local production server does not provide Vercel's deployment-owned route.
    await page.route("**/_vercel/insights/script.js", (route) =>
      route.fulfill({ contentType: "application/javascript", body: "" })
    );
  });

  test("keeps the original direct result and redraws immediately", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByText("+38", { exact: true })).toBeVisible();
    await expect(page.getByText("+88", { exact: true })).toBeVisible();
    const drawing = page.getByRole("img", { name: /stem and spacer geometry/i });
    const viewBox = await drawing.getAttribute("viewBox");
    const stem = drawing.locator('line[aria-label="stem"]');
    const before = await stem.getAttribute("x2");

    await slider(page, "Stem length").fill("150");

    await expect(page.getByText("+138", { exact: true })).toBeVisible();
    expect(await stem.getAttribute("x2")).not.toBe(before);
    expect(await drawing.getAttribute("viewBox")).toBe(viewBox);
  });

  test("keeps editable values and sliders synchronized", async ({ page }) => {
    await page.goto("/");

    const stemValue = controlValue(page, "Stem length");
    await stemValue.fill("95");
    await expect(slider(page, "Stem length")).toHaveValue("95");
    await expect(slider(page, "Stem length")).toHaveAttribute("step", "any");
    await expect(page.getByText("+83", { exact: true })).toBeVisible();

    await stemValue.press("ArrowUp");
    await expect(stemValue).toHaveValue("105");
    await expect(slider(page, "Stem length")).toHaveValue("105");

    await slider(page, "Stem length").fill("130");
    await expect(stemValue).toHaveValue("130");

    await stemValue.fill("40");
    await expect(slider(page, "Stem length")).toHaveAttribute("min", "40");
    await expect(slider(page, "Stem length")).toHaveValue("40");

    await controlValue(page, "Spacer stack").fill("200");
    await expect(slider(page, "Spacer stack")).toHaveAttribute("max", "200");
    await expect(slider(page, "Spacer stack")).toHaveValue("200");
  });

  test("keeps a typed off-grid value through a saved-link reload", async ({
    page,
  }) => {
    await page.goto("/");

    await controlValue(page, "Stem length").fill("95");
    await expect.poll(() => readUrlState(page)?.stem).toBe(95);

    await page.reload();

    await expect(controlValue(page, "Stem length")).toHaveValue("95");
    await expect(slider(page, "Stem length")).toHaveValue("95");
    await expect(slider(page, "Stem length")).toHaveAttribute("min", "50");
    await expect(slider(page, "Stem length")).toHaveAttribute("max", "150");
    await expect(slider(page, "Stem length")).toHaveAttribute("step", "any");
  });

  test("keeps editable values visibly focused and long values readable", async ({
    page,
  }) => {
    await page.goto("/");
    const stemValue = controlValue(page, "Stem length");

    await stemValue.focus();
    const focusShadow = await stemValue.evaluate(
      (input) => getComputedStyle(input.parentElement!).boxShadow
    );
    expect(focusShadow).toContain("96, 104, 112");

    await stemValue.fill("1234567");
    const valueWidth = await stemValue.evaluate((input) => ({
      client: input.clientWidth,
      scroll: input.scrollWidth,
    }));
    expect(valueWidth.scroll).toBeLessThanOrEqual(valueWidth.client);
  });

  test("names only the measurements still needed for reverse solve", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByText(
        "Add frame stack, frame reach, HY, and HX to see matching setups."
      )
    ).toBeVisible();

    await page
      .getByRole("textbox", { name: "stack", exact: true })
      .fill("570");
    await page
      .getByRole("textbox", { name: "reach", exact: true })
      .fill("389");

    await expect(
      page.getByText("Add HY and HX to see matching setups.")
    ).toBeVisible();
    await expect(page.getByRole("status")).toHaveAttribute(
      "aria-live",
      "polite"
    );
    await expect(
      page.getByText("Enter all four measurements to see matching setups.")
    ).toHaveCount(0);
  });

  test("keeps a level installed-angle label clear of the stem", async ({
    page,
  }) => {
    await page.goto("/");
    const drawing = page.getByRole("img", { name: /stem and spacer geometry/i });
    const stemBox = await drawing
      .locator('line[aria-label="stem"]')
      .boundingBox();
    const labelBox = await drawing
      .getByText("0°", { exact: true })
      .boundingBox();

    expect(stemBox).not.toBeNull();
    expect(labelBox).not.toBeNull();
    expect(labelBox!.y).toBeGreaterThan(stemBox!.y + stemBox!.height);
  });

  test("restores the original explanation and distinguishes compared geometry by color", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByText(/help translate measurements between a frame and a fitting/)
    ).toBeVisible();
    await expect(
      page.getByText(/Or you can just use the sliders as a simple stem calculator/)
    ).toBeVisible();
    const titleBox = await page.getByRole("heading", { level: 1 }).boundingBox();
    const explanationBox = await page
      .getByText(/help translate measurements between a frame and a fitting/)
      .boundingBox();
    expect(titleBox?.height ?? 999).toBeLessThan(60);
    expect(explanationBox?.y ?? 0).toBeGreaterThan(
      (titleBox?.y ?? 0) + (titleBox?.height ?? 0)
    );

    const drawing = page.getByRole("img", { name: /stem and spacer geometry/i });
    await expect(drawing.locator('line[aria-label="stem"]')).toHaveCSS(
      "stroke",
      "rgb(36, 95, 204)"
    );
    await expect(drawing.locator('line[aria-label="spacer stack"]')).toHaveCSS(
      "stroke",
      "rgb(36, 95, 204)"
    );

    await page
      .getByRole("button", {
        name: "Pin this setup and compare a new one",
      })
      .click();
    await expect(
      drawing.locator('[data-setup="pinned"][data-segment="stem"]')
    ).toHaveCSS("stroke", "rgb(36, 95, 204)");
    await expect(
      drawing.locator('[data-setup="current"][data-segment="stem"]')
    ).toHaveCSS("stroke", "rgb(192, 57, 43)");
    await expect(
      drawing.locator('[aria-label="Installed stem angle"] line')
    ).toHaveCSS("stroke", "rgb(192, 57, 43)");
    const key = page.getByLabel("Diagram key");
    await expect(key.getByText("Pinned setup", { exact: true })).toBeVisible();
    await expect(key.getByText("Current setup", { exact: true })).toBeVisible();
    await expect(key.getByText("Head tube", { exact: true })).toBeVisible();
  });

  test("draws the shorter coincident setup segment on top", async ({
    page,
  }) => {
    await page.goto(withState(completeState));
    await page
      .getByRole("button", {
        name: "Pin this setup and compare a new one",
      })
      .click();

    const drawing = page.getByRole("img", { name: /stem and spacer geometry/i });
    const pinnedSpacer = drawing.locator(
      '[data-setup="pinned"][data-segment="spacer"]'
    );
    const pinnedStem = drawing.locator(
      '[data-setup="pinned"][data-segment="stem"]'
    );
    const currentSpacer = drawing.locator(
      '[data-setup="current"][data-segment="spacer"]'
    );
    const currentStem = drawing.locator(
      '[data-setup="current"][data-segment="stem"]'
    );
    const pinnedEndpoint = drawing.locator(
      '[aria-label="Pinned handlebar center"]'
    );
    const currentEndpoint = drawing.locator(
      '[aria-label="Current handlebar center"]'
    );
    const coordinate = (line: typeof currentStem, name: string) =>
      line.getAttribute(name).then(Number);
    const layerOrder = (segment: "spacer" | "stem") =>
      drawing
        .locator(`[data-segment="${segment}"]`)
        .evaluateAll((elements) =>
          elements.map((element) => element.getAttribute("data-setup"))
        );

    await expect(pinnedStem).toHaveCSS("stroke-width", "6px");
    await expect(currentStem).toHaveCSS("stroke-width", "6px");
    await expect(pinnedStem).toHaveCSS("stroke-dasharray", "none");
    await expect(currentStem).toHaveCSS("stroke-dasharray", "none");
    await expect(pinnedStem).toHaveCSS("stroke-linecap", "butt");
    await expect(currentStem).toHaveCSS("stroke-linecap", "butt");
    await expect(pinnedStem).toHaveCSS("stroke", "rgb(36, 95, 204)");
    await expect(currentStem).toHaveCSS("stroke", "rgb(192, 57, 43)");
    await expect(pinnedEndpoint).toHaveAttribute("r", "3.5");
    await expect(currentEndpoint.locator("line")).toHaveCount(2);
    await expect(currentEndpoint.locator("line").first()).toHaveCSS(
      "stroke",
      "rgb(192, 57, 43)"
    );
    await expect(currentEndpoint.locator("line").first()).toHaveCSS(
      "stroke-linecap",
      "butt"
    );
    const endpointLayerOrder = await drawing
      .locator(
        '[aria-label="Fit target"], [aria-label="Pinned handlebar center"], [aria-label="Current handlebar center"]'
      )
      .evaluateAll((elements) =>
        elements.map((element) => element.getAttribute("aria-label"))
      );
    expect(endpointLayerOrder).toEqual([
      "Pinned handlebar center",
      "Fit target",
      "Current handlebar center",
    ]);
    await expect(
      drawing.locator('[data-drawing-layer="current-casing"]')
    ).toHaveCount(0);
    expect(await coordinate(pinnedSpacer, "x2")).toBe(
      await coordinate(currentSpacer, "x2")
    );
    expect(await coordinate(pinnedStem, "x2")).toBe(
      await coordinate(currentStem, "x2")
    );
    expect(await layerOrder("spacer")).toEqual(["current", "pinned"]);
    expect(await layerOrder("stem")).toEqual(["current", "pinned"]);
    await expect(
      page.getByLabel("Diagram key").getByText("Fit target", { exact: true })
    ).toBeVisible();
    const pinnedCenterX = Number(await pinnedEndpoint.getAttribute("cx"));
    const currentArm = currentEndpoint.locator("line").first();
    expect(Number(await currentArm.getAttribute("x1"))).toBe(
      pinnedCenterX - 8
    );
    expect(Number(await currentArm.getAttribute("x2"))).toBe(
      pinnedCenterX + 8
    );

    const pinnedStemEnd = await coordinate(pinnedStem, "x2");
    await slider(page, "Stem length").fill("110");
    expect(await coordinate(pinnedStem, "x2")).toBe(pinnedStemEnd);
    expect(await coordinate(currentStem, "x2")).not.toBe(pinnedStemEnd);
    expect(await layerOrder("stem")).toEqual(["current", "pinned"]);

    await slider(page, "Stem length").fill("90");
    expect(await coordinate(currentStem, "x2")).toBeLessThan(pinnedStemEnd);
    expect(await layerOrder("stem")).toEqual(["pinned", "current"]);

    await slider(page, "Stem length").fill("100");
    await slider(page, "Spacer stack").fill("50");
    expect(await coordinate(currentSpacer, "x2")).not.toBe(
      await coordinate(pinnedSpacer, "x2")
    );
    expect(await layerOrder("spacer")).toEqual(["current", "pinned"]);
    expect(await layerOrder("stem")).toEqual(["pinned", "current"]);

    await slider(page, "Spacer stack").fill("30");
    expect(await layerOrder("spacer")).toEqual(["pinned", "current"]);

    await slider(page, "Spacer stack").fill("40");
    await slider(page, "Printed stem angle").fill("6");
    expect(await coordinate(currentStem, "y2")).not.toBe(
      await coordinate(pinnedStem, "y2")
    );

    expect(await layerOrder("stem")).toEqual(["pinned", "current"]);

    await slider(page, "Stem length").fill("110");
    expect(await layerOrder("stem")).toEqual(["pinned", "current"]);

    await slider(page, "Stem length").fill("100");
    await slider(page, "Printed stem angle").fill("17");
    await page.getByRole("button", { name: /^up/i }).click();
    expect(await layerOrder("stem")).toEqual(["pinned", "current"]);
    expect(await coordinate(currentStem, "y2")).not.toBe(
      await coordinate(pinnedStem, "y2")
    );

    await slider(page, "Spacer stack").fill("0");
    expect(await coordinate(currentSpacer, "x1")).toBe(
      await coordinate(currentSpacer, "x2")
    );
    expect(await coordinate(currentSpacer, "y1")).toBe(
      await coordinate(currentSpacer, "y2")
    );
  });

  test("positions diagram labels with a readable halo", async ({
    page,
  }) => {
    await page.goto(
      withState({
        ...completeState,
        angleHt: 72,
        stemAngle: 4,
        orientation: "up",
      })
    );
    const drawing = page.getByRole("img", { name: /stem and spacer geometry/i });
    const angleLabel = drawing.getByText("22°", { exact: true });
    const headTubeLabel = drawing.getByText("head tube top", { exact: true });

    await expect(angleLabel).toHaveAttribute("text-anchor", "middle");
    await expect(angleLabel).toHaveCSS("paint-order", "stroke");
    await expect(angleLabel).toHaveCSS("stroke-width", "3px");
    await expect(headTubeLabel).toHaveAttribute("x", "32");
    await expect(headTubeLabel).toHaveAttribute("y", "30");
    await expect(headTubeLabel).toHaveCSS("paint-order", "stroke");
    await expect(drawing.locator('line[aria-label="head tube"]')).toHaveCSS(
      "stroke-width",
      "7px"
    );
  });

  test("meets WCAG AA contrast for text, controls, and diagram colors", async ({
    page,
  }) => {
    await page.goto("/");
    const palette = await page.locator("main").evaluate((element) => {
      const style = getComputedStyle(element);
      return Object.fromEntries(
        [
          "page",
          "card",
          "wash",
          "ink",
          "muted",
          "control",
          "control-border",
          "blue",
          "red",
          "yellow",
          "success",
          "caution",
          "tooltip",
          "tooltip-strong",
        ].map((name) => [name, style.getPropertyValue(`--${name}`).trim()])
      );
    });

    for (const foreground of ["ink", "muted", "control"]) {
      for (const background of ["page", "card", "wash"]) {
        expect(
          contrastRatio(palette[foreground], palette[background]),
          `${foreground} on ${background}`
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
    for (const foreground of ["blue", "red", "yellow"]) {
      expect(
        contrastRatio(palette[foreground], palette.card),
        `${foreground} diagram stroke on card`
      ).toBeGreaterThanOrEqual(3);
    }
    for (const foreground of ["success", "caution", "red", "tooltip"]) {
      for (const background of ["card", "wash"]) {
        expect(
          contrastRatio(palette[foreground], palette[background]),
          `${foreground} text on ${background}`
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
    for (const background of ["page", "card", "wash"]) {
      expect(
        contrastRatio(palette["control-border"], palette[background]),
        `control boundary on ${background}`
      ).toBeGreaterThanOrEqual(3);
    }
  });

  test("colors target differences by their displayed proximity", async ({
    page,
  }) => {
    await page.goto(withState(completeState));
    const drawing = page.getByRole("img", { name: /stem and spacer geometry/i });
    const height = page.locator('[data-axis="height"]');
    const reach = page.locator('[data-axis="reach"]');

    await expect(drawing.locator('[aria-label="Fit target"] circle').first()).toHaveAttribute(
      "r",
      "5"
    );
    await expect(
      drawing.locator('[aria-label="Fit target"] circle').first()
    ).toHaveCSS("fill", "none");
    await expect(height).toHaveAttribute("data-proximity", "far");
    await expect(height).toHaveCSS("color", "rgb(192, 57, 43)");
    await expect(reach).toHaveAttribute("data-proximity", "close");
    await expect(reach).toHaveCSS("color", "rgb(138, 90, 0)");

    await page.getByRole("textbox", { name: "handlebarStack" }).fill("608.25");
    await page.getByRole("textbox", { name: "handlebarReach" }).fill("477.31");
    await expect(height).toHaveAttribute("data-proximity", "on-target");
    await expect(reach).toHaveAttribute("data-proximity", "on-target");
    await expect(height).toHaveCSS("color", "rgb(31, 111, 67)");
    await expect(reach).toHaveCSS("color", "rgb(31, 111, 67)");
  });

  test("keeps tooltip triggers visibly accented", async ({ page }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "About Spacer stack" });

    await expect(trigger).toHaveCSS("color", "rgb(154, 79, 0)");
    await expect(trigger).toHaveCSS("border-color", "rgb(154, 79, 0)");
    await trigger.hover();
    await expect(trigger).toHaveCSS("color", "rgb(116, 59, 0)");
  });

  test("keeps inputs, drawing, and labeled matches side by side on desktop", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(withState(completeState));

    const setup = page.locator('section[aria-labelledby="setup-title"]');
    const frame = page.locator('section[aria-labelledby="frame-title"]');
    const result = page.locator('section[aria-labelledby="result-title"]');
    const matches = page.locator('section[aria-labelledby="matches-title"]');
    const orientation = page.getByRole("group", { name: "Orientation" });
    const setupName = setup.locator('input[name="name"]');
    const setupHeading = setup.getByRole("heading", { name: "Stem & spacers" });
    await expect(matchRows(page)).toHaveCount(6);
    await expect(
      setup.getByRole("slider", { name: "Stem length" })
    ).toHaveAttribute("min", "50");
    await expect(
      matches.getByText(/common 50–150 mm fixed stems/)
    ).toBeVisible();
    await expect(matchRows(page).first()).toHaveCSS(
      "background-color",
      "rgb(240, 244, 249)"
    );
    await expect(matchRows(page).nth(1)).toHaveCSS(
      "background-color",
      "rgb(255, 255, 255)"
    );
    await expect(result).toBeVisible();
    const [setupBox, frameBox, resultBox, matchesBox] = await Promise.all([
      setup.boundingBox(),
      frame.boundingBox(),
      result.boundingBox(),
      matches.boundingBox(),
    ]);

    expect(Math.abs((setupBox?.x ?? 0) - (frameBox?.x ?? 0))).toBeLessThan(2);
    expect(resultBox?.x ?? 0).toBeGreaterThan(setupBox?.x ?? 0);
    expect(matchesBox?.x ?? 0).toBeGreaterThan(resultBox?.x ?? 0);
    expect(resultBox?.width ?? 0).toBeLessThan(matchesBox?.width ?? 0);
    expect((await setupName.boundingBox())?.y ?? 999).toBeLessThan(
      (await setupHeading.boundingBox())?.y ?? 0
    );
    expect((await orientation.boundingBox())?.height ?? 999).toBeLessThan(34);
    await expect(
      setup.getByRole("slider", { name: "Head tube angle" })
    ).toBeVisible();
    await expect(
      frame.getByRole("slider", { name: "Head tube angle" })
    ).toHaveCount(0);
    await expect(
      matches.locator('[data-label="Height vs target"]').first()
    ).toBeVisible();
    await expect(
      matches.locator('[data-label="Reach vs target"]').first()
    ).toBeVisible();
  });

  test("loads a current saved setup", async ({ page }) => {
    await page.goto(
      withState({
        ...completeState,
        spacer: 35,
        stem: 110,
        stemAngle: 6,
        orientation: "up",
        name: "Road setup",
      })
    );

    await expect(slider(page, "Spacer stack")).toHaveValue("35");
    await expect(slider(page, "Stem length")).toHaveValue("110");
    await expect(slider(page, "Printed stem angle")).toHaveValue("6");
    await expect(page.getByRole("button", { name: /^up/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await expect(page.getByRole("textbox", { name: "name" })).toHaveValue(
      "Road setup"
    );
  });

  test("keeps an old out-of-range setup measurable and marks it off scale", async ({
    page,
  }) => {
    await page.goto(
      withState({
        spacer: 200,
        stem: 140,
        angleHt: 73,
        angleStem: 60,
        stack: "",
        reach: "",
        handlebarStack: "",
        handlebarReach: "",
        name: "",
      })
    );

    await expect(slider(page, "Spacer stack")).toHaveValue("200");
    await expect(slider(page, "Printed stem angle")).toHaveValue("43");
    await expect(page.getByText("+313", { exact: true })).toBeVisible();
    await expect(page.getByText("+12", { exact: true })).toBeVisible();
    await expect(
      page.locator('[aria-label="Handlebar center off scale"]')
    ).toBeVisible();
    const drawing = page.getByRole("img", {
      name: /stem and spacer geometry/i,
    });
    await expect(drawing).toHaveCSS("overflow", "hidden");
    const drawingBox = await drawing.boundingBox();
    const offScaleLabelBox = await drawing
      .getByText("Current setup (off scale)")
      .boundingBox();
    expect(offScaleLabelBox?.y).toBeGreaterThanOrEqual(drawingBox?.y ?? 0);

    await slider(page, "Spacer stack").fill("120");
    await expect(slider(page, "Spacer stack")).toHaveAttribute("max", "200");
    await slider(page, "Spacer stack").fill("200");
    await expect(slider(page, "Spacer stack")).toHaveValue("200");
  });

  test("migrates the real legacy URL without moving the cockpit", async ({
    page,
  }) => {
    const browserProblems = captureBrowserProblems(page);
    await page.goto(REAL_PRODUCTION_URL);

    await expect(slider(page, "Spacer stack")).toHaveValue("70");
    await expect(slider(page, "Stem length")).toHaveValue("140");
    await expect(slider(page, "Printed stem angle")).toHaveValue("20");
    await expect(page.getByRole("button", { name: /^up/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await expect(page.getByText("+151", { exact: true })).toBeVisible();
    await expect(page.getByText("+91", { exact: true })).toBeVisible();

    await expect
      .poll(() => readUrlState(page))
      .toMatchObject({ stemAngle: 20, orientation: "up" });
    expect(readUrlState(page)).not.toHaveProperty("angleStem");
    expect(browserProblems()).toEqual([]);
  });

  test("loads copied legacy parameters after an extra escaping layer", async ({
    page,
  }) => {
    const browserProblems = captureBrowserProblems(page);
    await page.goto(DOUBLE_ESCAPED_COPIED_URL);

    await expect(slider(page, "Spacer stack")).toHaveValue("34");
    await expect(slider(page, "Stem length")).toHaveValue("110");
    await expect(slider(page, "Printed stem angle")).toHaveValue("4");
    await expect(slider(page, "Head tube angle")).toHaveValue("72");
    await expect(page.locator('input[name="stack"]')).toHaveValue("620");
    await expect(page.locator('input[name="reach"]')).toHaveValue("403");
    await expect(page.locator('input[name="handlebarStack"]')).toHaveValue(
      "692"
    );
    await expect(page.locator('input[name="handlebarReach"]')).toHaveValue(
      "494"
    );
    await expect(page.getByText("Installed angle: 22° above horizontal")).toBeVisible();
    expect(browserProblems()).toEqual([]);
  });

  test("compares a setup live and persists the reference", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", {
        name: "Pin this setup and compare a new one",
      })
      .click();
    await expect(
      page.getByText("100 mm · 17° flipped · 40 mm spacers")
    ).toBeVisible();

    await slider(page, "Stem length").fill("110");

    await expect(page.getByText("+10", { exact: true })).toBeVisible();
    await expect(
      page.locator('[data-setup="pinned"][data-segment="stem"]')
    ).toHaveCSS("stroke", "rgb(36, 95, 204)");
    await expect
      .poll(() => readUrlState(page)?.reference)
      .toEqual({
        spacer: 40,
        stem: 100,
        stemAngle: 17,
        orientation: "flipped",
      });
  });

  test("accepts decimals and keeps validation local to one field", async ({
    page,
  }) => {
    await page.goto("/");
    const stack = page.getByRole("textbox", { name: "stack", exact: true });
    const reach = page.getByRole("textbox", { name: "reach", exact: true });

    await stack.fill("570.5");
    await reach.fill("389");
    await expect(stack).toHaveValue("570.5");
    await expect(reach).toHaveValue("389");

    await stack.fill("bad");
    await expect(page.getByText("Enter a positive number")).toBeVisible();
    await expect(reach).toBeEnabled();
  });

  test("keeps a loaded setup above five suggestions and restores it", async ({
    page,
  }) => {
    await page.goto(
      withState({
        ...completeState,
        spacer: 35,
        stem: 110,
        stemAngle: 6,
        orientation: "up",
      })
    );
    await expect(matchRows(page)).toHaveCount(6);
    await expect(matchRows(page).first()).toHaveAccessibleName(/Original setup/);
    await expect(
      page.locator('[data-label="Height vs target"]').first()
    ).toBeVisible();
    await expect(
      page.locator('[data-label="Reach vs target"]').first()
    ).toBeVisible();
    const before = await rowTexts(page);

    await matchRows(page).nth(1).click();

    await expect(matchRows(page).nth(1)).toHaveAttribute("aria-pressed", "true");
    expect(await rowTexts(page)).toEqual(before);

    await page.getByRole("button", { name: /^flipped/i }).click();
    await matchRows(page).first().click();
    await expect(slider(page, "Spacer stack")).toHaveValue("35");
    await expect(slider(page, "Stem length")).toHaveValue("110");
    await expect(slider(page, "Printed stem angle")).toHaveValue("6");
    await expect(page.getByRole("button", { name: /^up/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await expect(matchRows(page).first()).toHaveAttribute("aria-pressed", "true");

    await slider(page, "Spacer stack").fill("15");
    await slider(page, "Stem length").fill("130");
    expect(await rowTexts(page)).toEqual(before);
  });

  test("recomputes matches when frame or target inputs change", async ({
    page,
  }) => {
    await page.goto(withState(completeState));
    await expect(matchRows(page)).toHaveCount(6);
    const before = await rowTexts(page);

    await page.getByRole("textbox", { name: "handlebarStack" }).fill("665");

    await expect
      .poll(async () => JSON.stringify(await rowTexts(page)))
      .not.toBe(JSON.stringify(before));
  });

  test("calls out a target no fixed or adjustable stem can reach", async ({
    page,
  }) => {
    await page.goto(
      withState({
        ...completeState,
        handlebarStack: 900,
        handlebarReach: 700,
      })
    );

    await expect(page.getByText("Target outside common range")).toBeVisible();
    await expect(
      page.getByText(/Neither the fixed stems above nor an adjustable stem/)
    ).toBeVisible();
    const drawing = page.getByRole("img", {
      name: /stem and spacer geometry/i,
    });
    const drawingBox = await drawing.boundingBox();
    const targetLabelBox = await drawing.getByText("Target (off scale)").boundingBox();
    expect(targetLabelBox?.y).toBeGreaterThanOrEqual(drawingBox?.y ?? 0);
  });

  test("keeps the compact result and drawing visible while mobile sliders move", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const result = page.locator('section[aria-labelledby="result-title"]');
    const spacer = slider(page, "Spacer stack");

    await spacer.scrollIntoViewIfNeeded();
    await expect(result).toHaveCSS("position", "sticky");
    const resultBox = await result.boundingBox();
    const drawingBox = await page
      .getByRole("img", { name: /stem and spacer geometry/i })
      .boundingBox();

    expect(resultBox?.y).toBeGreaterThanOrEqual(0);
    expect(drawingBox?.y).toBeGreaterThanOrEqual(0);
    expect(drawingBox && drawingBox.y + drawingBox.height).toBeLessThanOrEqual(
      844
    );

    await spacer.fill("60");
    await expect(page.getByText("+57", { exact: true })).toBeVisible();
  });
});

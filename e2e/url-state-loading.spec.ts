import { test, expect } from "@playwright/test";

test.describe("URL State Loading", () => {
  test("should load configuration from URL on initial page load", async ({
    page,
  }) => {
    // Capture console logs from the browser
    page.on("console", (msg) => console.log("BROWSER:", msg.text()));

    // This is the actual URL format from the user's example
    // Decoded: {"stemXOrigin":100,"stemYOrigin":200,"spacer":62,"stem":120,"angleHt":73,"angleStem":0,"stack":"","reach":"","handlebarStack":"","handlebarReach":"","name":""}
    const urlWithState =
      "/?urlstate=%7B%22stemXOrigin%22%3A100%2C%22stemYOrigin%22%3A200%2C%22spacer%22%3A62%2C%22stem%22%3A120%2C%22angleHt%22%3A73%2C%22angleStem%22%3A0%2C%22stack%22%3A%22%22%2C%22reach%22%3A%22%22%2C%22handlebarStack%22%3A%22%22%2C%22handlebarReach%22%3A%22%22%2C%22name%22%3A%22%22%7D";

    await page.goto(urlWithState);

    // Wait for the page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Verify slider values are loaded from URL
    const spacerSlider = page.getByRole("slider", { name: "spacer_slider" });
    await expect(spacerSlider).toHaveValue("62");

    const stemSlider = page.getByRole("slider", {
      name: "stem_slider",
      exact: true,
    });
    await expect(stemSlider).toHaveValue("120");

    const angleHtSlider = page.getByRole("slider", { name: "angleht_slider" });
    await expect(angleHtSlider).toHaveValue("73");

    const angleStemSlider = page.getByRole("slider", {
      name: "anglestem_slider",
    });
    await expect(angleStemSlider).toHaveValue("0");
  });

  test("should load configuration with name field populated", async ({
    page,
  }) => {
    // Configuration with a name
    const stateWithName = {
      stemXOrigin: 100,
      stemYOrigin: 200,
      spacer: 40,
      stem: 100,
      angleHt: 73,
      angleStem: -6,
      stack: "",
      reach: "",
      handlebarStack: "",
      handlebarReach: "",
      name: "My Bike Setup",
    };

    const encodedState = encodeURIComponent(JSON.stringify(stateWithName));
    await page.goto(`/?urlstate=${encodedState}`);

    // Wait for the page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Verify the name field is populated
    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toHaveValue("My Bike Setup");

    // Verify slider values
    const spacerSlider = page.getByRole("slider", { name: "spacer_slider" });
    await expect(spacerSlider).toHaveValue("40");

    const stemSlider = page.getByRole("slider", {
      name: "stem_slider",
      exact: true,
    });
    await expect(stemSlider).toHaveValue("100");

    const angleStemSlider = page.getByRole("slider", {
      name: "anglestem_slider",
    });
    await expect(angleStemSlider).toHaveValue("-6");
  });

  test("should persist state changes to URL", async ({ page }) => {
    await page.goto("/");

    // Wait for the page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Change a slider value
    const spacerSlider = page.getByRole("slider", { name: "spacer_slider" });
    await spacerSlider.fill("80");

    // Wait for debounce (250ms) + a bit extra
    await page.waitForTimeout(400);

    // Verify URL was updated with the new state
    const url = page.url();
    expect(url).toContain("urlstate=");
    // Check for the spacer value (allow different encoding formats)
    expect(url).toMatch(/(spacer.*80|%22spacer%22.*80)/i);
  });

  test("should not overwrite URL state on initial load", async ({ page }) => {
    // Capture console logs from the browser
    page.on("console", (msg) => console.log("BROWSER:", msg.text()));

    // This is the critical test - ensure we don't overwrite the URL with defaults
    // Must use a full valid state object with all required fields
    const testState = {
      stemXOrigin: 100,
      stemYOrigin: 200,
      spacer: 75,
      stem: 110,
      angleHt: 73,
      angleStem: -6,
      stack: "",
      reach: "",
      handlebarStack: "",
      handlebarReach: "",
      name: "",
    };

    const encodedState = encodeURIComponent(JSON.stringify(testState));
    await page.goto(`/?urlstate=${encodedState}`);
    await page.waitForLoadState("networkidle");

    // Wait a moment to ensure no overwrites happen
    await page.waitForTimeout(500);

    // Verify URL still contains our original state
    const url = page.url();
    expect(url).toContain("spacer");
    expect(url).toContain("75");
    expect(url).toContain("stem");
    expect(url).toContain("110");
  });

  test("should update URL when sliders are changed from existing state", async ({
    page,
  }) => {
    // Start with existing URL state
    const initialState = {
      stemXOrigin: 100,
      stemYOrigin: 200,
      spacer: 40,
      stem: 100,
      angleHt: 73,
      angleStem: 0,
      stack: "",
      reach: "",
      handlebarStack: "",
      handlebarReach: "",
      name: "Test Config",
    };

    const encodedState = encodeURIComponent(JSON.stringify(initialState));
    await page.goto(`/?urlstate=${encodedState}`);
    await page.waitForLoadState("networkidle");

    // Modify multiple sliders
    const spacerSlider = page.getByRole("slider", { name: "spacer_slider" });
    await spacerSlider.fill("65");

    const stemSlider = page.getByRole("slider", {
      name: "stem_slider",
      exact: true,
    });
    await stemSlider.fill("120");

    const angleHtSlider = page.getByRole("slider", { name: "angleht_slider" });
    await angleHtSlider.fill("74.5");

    // Wait for debounce
    await page.waitForTimeout(400);

    // Verify URL was updated with ALL changes
    const url = page.url();
    expect(url).toContain("urlstate=");

    // Decode and parse the URL state
    const urlParams = new URL(url).searchParams;
    const urlState = urlParams.get("urlstate");
    expect(urlState).toBeTruthy();

    const parsedState = JSON.parse(urlState!);
    expect(parsedState.spacer).toBe(65);
    expect(parsedState.stem).toBe(120);
    expect(parsedState.angleHt).toBe(74.5);
    expect(parsedState.name).toBe("Test Config"); // Should preserve name
  });

  test("should load old URL format without name field (backward compatibility)", async ({
    page,
  }) => {
    // Old format: has input/value fields, no name field
    const oldFormatState = {
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
      input: "spacer", // old field that should be ignored
      value: 44, // old field that should be ignored
    };

    const encodedState = encodeURIComponent(JSON.stringify(oldFormatState));
    await page.goto(`/?urlstate=${encodedState}`);
    await page.waitForLoadState("networkidle");

    // Verify slider values loaded correctly
    const spacerSlider = page.getByRole("slider", { name: "spacer_slider" });
    await expect(spacerSlider).toHaveValue("44");

    const stemSlider = page.getByRole("slider", {
      name: "stem_slider",
      exact: true,
    });
    await expect(stemSlider).toHaveValue("120");

    const angleHtSlider = page.getByRole("slider", { name: "angleht_slider" });
    await expect(angleHtSlider).toHaveValue("73");

    const angleStemSlider = page.getByRole("slider", {
      name: "anglestem_slider",
    });
    await expect(angleStemSlider).toHaveValue("23");

    // Verify name field defaults to empty
    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toHaveValue("");
  });

  test("should load REAL production old URL format (rigorous test)", async ({
    page,
  }) => {
    // This is an ACTUAL old production URL that was failing
    // From: https://www.bikestem.fit/?urlstate=%7B%22stemXOrigin%22%3A100%2C%22stemYOrigin%22%3A200%2C%22spacer%22%3A70%2C%22stem%22%3A140%2C%22angleHt%22%3A73%2C%22angleStem%22%3A37%2C%22stack%22%3A565%2C%22reach%22%3A383%2C%22handlebarStack%22%3A717%2C%22handlebarReach%22%3A475%2C%22input%22%3A%22angleStem%22%2C%22value%22%3A37%7D

    // Capture console output to detect parsing errors
    const consoleMessages: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      consoleMessages.push(text);
      console.log("BROWSER:", text);
    });

    const realOldUrl =
      "/?urlstate=%7B%22stemXOrigin%22%3A100%2C%22stemYOrigin%22%3A200%2C%22spacer%22%3A70%2C%22stem%22%3A140%2C%22angleHt%22%3A73%2C%22angleStem%22%3A37%2C%22stack%22%3A565%2C%22reach%22%3A383%2C%22handlebarStack%22%3A717%2C%22handlebarReach%22%3A475%2C%22input%22%3A%22angleStem%22%2C%22value%22%3A37%7D";

    await page.goto(realOldUrl);
    await page.waitForLoadState("networkidle");

    // Wait a bit more to ensure React has fully hydrated
    await page.waitForTimeout(500);

    // Ensure no parser warnings/errors
    const hasParserError = consoleMessages.some((msg) =>
      msg.includes("Invalid fit state")
    );
    expect(hasParserError).toBe(false);

    // Verify ALL slider values match the exact URL data
    const spacerSlider = page.getByRole("slider", { name: "spacer_slider" });
    await expect(spacerSlider).toHaveValue("70");

    const stemSlider = page.getByRole("slider", {
      name: "stem_slider",
      exact: true,
    });
    await expect(stemSlider).toHaveValue("140");

    const angleHtSlider = page.getByRole("slider", { name: "angleht_slider" });
    await expect(angleHtSlider).toHaveValue("73");

    const angleStemSlider = page.getByRole("slider", {
      name: "anglestem_slider",
    });
    await expect(angleStemSlider).toHaveValue("37");

    // Verify text input fields (these are critical for the full configuration)
    const stackInput = page.locator('input[name="stack"]');
    await expect(stackInput).toHaveValue("565");

    const reachInput = page.locator('input[name="reach"]');
    await expect(reachInput).toHaveValue("383");

    const handlebarStackInput = page.locator('input[name="handlebarStack"]');
    await expect(handlebarStackInput).toHaveValue("717");

    const handlebarReachInput = page.locator('input[name="handlebarReach"]');
    await expect(handlebarReachInput).toHaveValue("475");

    // Verify name field defaults to empty (no name in old format)
    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toHaveValue("");

    // Final check: URL should still contain the state (not reverted to defaults)
    const currentUrl = page.url();
    expect(currentUrl).toContain("urlstate=");
    
    // Decode and verify the URL state wasn't corrupted
    const urlParams = new URL(currentUrl).searchParams;
    const urlState = urlParams.get("urlstate");
    expect(urlState).toBeTruthy();
    
    const finalParsedState = JSON.parse(urlState!);
    expect(finalParsedState.spacer).toBe(70);
    expect(finalParsedState.stem).toBe(140);
    expect(finalParsedState.angleStem).toBe(37);
    expect(finalParsedState.stack).toBe(565);
    expect(finalParsedState.reach).toBe(383);
    expect(finalParsedState.handlebarStack).toBe(717);
    expect(finalParsedState.handlebarReach).toBe(475);
  });

  test("should load partial URL state with missing fields", async ({
    page,
  }) => {
    // Partial state with only some fields - should use defaults for missing ones
    const partialState = {
      spacer: 55,
      stem: 95,
      name: "Partial",
    };

    const consoleMessages: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      consoleMessages.push(text);
      console.log("BROWSER:", text);
    });

    const encodedState = encodeURIComponent(JSON.stringify(partialState));
    await page.goto(`/?urlstate=${encodedState}`);
    await page.waitForLoadState("networkidle");

    // Wait longer for React hydration AND debounce effect (250ms + buffer)
    await page.waitForTimeout(1000);

    // Check for parser errors
    const hasParserError = consoleMessages.some((msg) =>
      msg.includes("Invalid fit state")
    );
    expect(hasParserError).toBe(false);

    // Verify provided fields loaded
    const spacerSlider = page.getByRole("slider", { name: "spacer_slider" });
    await expect(spacerSlider).toHaveValue("55");

    const stemSlider = page.getByRole("slider", {
      name: "stem_slider",
      exact: true,
    });
    await expect(stemSlider).toHaveValue("95");

    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toHaveValue("Partial");

    // Verify missing fields use defaults (from INITIAL_FIT_STATE)
    const angleHtSlider = page.getByRole("slider", { name: "angleht_slider" });
    await expect(angleHtSlider).toHaveValue("73"); // default

    const angleStemSlider = page.getByRole("slider", {
      name: "anglestem_slider",
    });
    await expect(angleStemSlider).toHaveValue("0"); // default
  });
});

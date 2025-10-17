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
});

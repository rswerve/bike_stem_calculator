import { expect, test } from "@playwright/test";

const canonicalUrl = "https://www.bikestem.fit/";
const description =
  "Calculate how stem length, angle, and spacer stack move your handlebar. Enter frame stack and reach plus your HX and HY fit target to find matching stems.";
const socialImageUrl = `${canonicalUrl}og.png`;

const introParagraphs = [
  "This is a road bike stem calculator that can also help translate measurements between a frame and a fitting.",
  "If you have frame and fit numbers, enter them below and adjust the sliders to see if a workable configuration is available. You want the sum of the frame and the stem to be as close as possible to HX and HY. Or you can just use the sliders as a simple stem calculator.",
  "To save your work, simply bookmark the page.",
];

test.describe("search and sharing metadata", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/_vercel/insights/script.js", (route) =>
      route.fulfill({ contentType: "application/javascript", body: "" })
    );
  });

  test("renders complete metadata in the server response", async ({
    request,
  }) => {
    const response = await request.get("/");
    const html = await response.text();

    expect(response.ok()).toBe(true);
    expect(html).toMatch(/<html[^>]*\blang="en"/);
    expect(html).toMatch(
      /<title[^>]*>Bike Stem Calculator \| BikeStem\.fit<\/title>/
    );
    expect(html).toContain(
      `<meta name="description" content="${description}"`
    );
    expect(html).toContain(
      `<link rel="canonical" href="${canonicalUrl}"`
    );
    expect(html).toContain(
      `<meta property="og:image" content="${socialImageUrl}"`
    );
    expect(html).toContain(
      '<meta property="og:image:width" content="1200"'
    );
    expect(html).toContain(
      '<meta property="og:image:height" content="630"'
    );
    expect(html).toContain(
      '<meta name="twitter:card" content="summary_large_image"'
    );
  });

  test("canonicalizes saved setups while retaining their browser title", async ({
    page,
  }) => {
    await page.goto("/");

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute("href", canonicalUrl);
    await page.getByRole("textbox", { name: /Setup name/ }).fill("Road fit");
    await expect(page).toHaveTitle(
      "Road fit · Bike Stem Calculator | BikeStem.fit"
    );
    await expect(canonical).toHaveAttribute("href", canonicalUrl);

    await page.goto("/?urlstate=%7B%22name%22%3A%22Saved%20fit%22%7D");
    await expect(canonical).toHaveAttribute("href", canonicalUrl);
  });

  test("keeps the compact introduction unchanged and the expanded heading hidden", async ({
    page,
  }) => {
    await page.goto("/");

    for (const paragraph of introParagraphs) {
      await expect(page.getByText(paragraph, { exact: true })).toBeVisible();
    }

    const expandedHeading = page.locator('h1 span[class*="visuallyHidden"]');
    await expect(expandedHeading).toHaveText(
      " — bike stem calculator for stem length, angle, and spacer stack"
    );
    await expect
      .poll(() =>
        expandedHeading.evaluate((element) => {
          const style = getComputedStyle(element);
          return {
            clip: style.clip,
            height: style.height,
            overflow: style.overflow,
            position: style.position,
            width: style.width,
          };
        })
      )
      .toEqual({
        clip: "rect(0px, 0px, 0px, 0px)",
        height: "1px",
        overflow: "hidden",
        position: "absolute",
        width: "1px",
      });
  });

  test("serves crawler files and a correctly sized social image", async ({
    request,
  }) => {
    const [robotsResponse, sitemapResponse, imageResponse] = await Promise.all([
      request.get("/robots.txt"),
      request.get("/sitemap.xml"),
      request.get("/og.png"),
    ]);

    expect(robotsResponse.ok()).toBe(true);
    const robots = await robotsResponse.text();
    expect(robots).toContain("Disallow: /api/");
    expect(robots).toContain(`Sitemap: ${canonicalUrl}sitemap.xml`);
    expect(robots).not.toContain("urlstate");
    expect(sitemapResponse.ok()).toBe(true);
    expect(await sitemapResponse.text()).toContain(
      `<loc>${canonicalUrl}</loc>`
    );
    expect(imageResponse.ok()).toBe(true);
    expect(imageResponse.headers()["content-type"]).toContain("image/png");

    const image = await imageResponse.body();
    expect(image.subarray(1, 4).toString("ascii")).toBe("PNG");
    expect(image.readUInt32BE(16)).toBe(1200);
    expect(image.readUInt32BE(20)).toBe(630);
  });
});

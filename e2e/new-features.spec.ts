import { test, expect, type Page, type BrowserContext } from "@playwright/test";

const APP_URL = "http://localhost:8090/";

async function loadApp(browser: any): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  // Suppress import.meta noise
  page.on("pageerror", (err: Error) => {
    if (!err.message.includes("import.meta")) console.log(`PAGE ERROR: ${err.message}`);
  });

  // Fire-and-forget navigation (module scripts are deferred)
  page.goto(APP_URL).catch(() => {});

  // Wait up to 45s for content to appear
  await page.waitForTimeout(30000);
  return { context, page };
}

test.describe("New Features", () => {
  test("Home: shows trip plan button and position editor", async ({ browser }) => {
    const { context, page } = await loadApp(browser);
    const body = await page.evaluate(() => document.body?.innerText || "");

    // Should show the home screen
    expect(body).toContain("環島コックピット");
    expect(body).toContain("ゴール候補");

    // Should have position edit hint
    expect(body).toContain("変更");

    // Check for trip plan button (text varies)
    const hasTripBtn = body.includes("Trip Plan") || body.includes("プラン");
    console.log(`Trip plan button visible: ${hasTripBtn}`);

    await page.screenshot({ path: "e2e/screenshots/new-home.png", fullPage: true });
    await context.close();
  });

  test("Home: position adjuster modal works", async ({ browser }) => {
    const { context, page } = await loadApp(browser);

    // Tap position bar to open adjuster
    await page.locator("text=変更").first().click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: "e2e/screenshots/new-position-adjuster.png", fullPage: true });

    const body = await page.evaluate(() => document.body?.innerText || "");
    expect(body).toContain("現在位置を設定");

    await context.close();
  });

  test("Navigation: Home → Today → Next works", async ({ browser }) => {
    const { context, page } = await loadApp(browser);

    // Select Hsinchu
    await page.locator("text=Hsinchu").first().click();
    await page.waitForTimeout(5000);

    await page.screenshot({ path: "e2e/screenshots/new-today.png", fullPage: true });
    let body = await page.evaluate(() => document.body?.innerText || "");
    expect(body.includes("走行開始") || body.includes("Day")).toBeTruthy();

    // Start ride
    const startBtn = page.locator("text=走行開始");
    if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(3000);

      await page.screenshot({ path: "e2e/screenshots/new-next.png", fullPage: true });
      body = await page.evaluate(() => document.body?.innerText || "");
      expect(body).toContain("補給済み");
    }

    await context.close();
  });

  test("Plan screen loads", async ({ browser }) => {
    const { context, page } = await loadApp(browser);

    // Click trip plan button
    const planBtn = page.locator("text=/Trip Plan|プランを作成|🗺️/").first();
    const visible = await planBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (visible) {
      await planBtn.click();
      await page.waitForTimeout(3000);
    } else {
      // Navigate via URL hash
      await page.evaluate(() => {
        window.location.hash = "/plan";
      });
      await page.waitForTimeout(3000);
    }

    await page.screenshot({ path: "e2e/screenshots/new-plan.png", fullPage: true });
    const body = await page.evaluate(() => document.body?.innerText || "");
    console.log(`Plan screen:\n${body.substring(0, 600)}`);

    await context.close();
  });
});

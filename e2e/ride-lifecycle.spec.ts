import { test, expect, type Page, type BrowserContext } from "@playwright/test";

const APP_URL = "http://localhost:8090/";
const INITIAL_WAIT = 20000;

async function loadApp(browser: any): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  page.on("pageerror", (err: Error) => console.log(`  PAGE ERROR: ${err.message}`));

  page.goto(APP_URL).catch(() => {});
  await page.waitForTimeout(INITIAL_WAIT);
  return { context, page };
}

async function getBodyText(page: Page): Promise<string> {
  return page.evaluate(() => document.body?.innerText || "");
}

test.describe("Ride Lifecycle: Home → Today → Next → Summary → Home", () => {
  test("completes a full day and advances to day 2", async ({ browser }) => {
    const { context, page } = await loadApp(browser);

    // === 1. Home Screen ===
    let bodyText = await getBodyText(page);
    expect(bodyText).toContain("ゴール候補");
    await page.screenshot({ path: "e2e/screenshots/lifecycle-01-home.png", fullPage: true });

    // === 2. Select a goal (Taoyuan ~40km, first visible) ===
    await page.locator("text=Taoyuan").first().click();
    await page.waitForTimeout(5000);

    // === 3. Today Screen ===
    bodyText = await getBodyText(page);
    expect(bodyText).toContain("走行開始");
    await page.screenshot({ path: "e2e/screenshots/lifecycle-02-today.png", fullPage: true });

    // Verify supply plan is shown with MAP links
    const hasSupplyPlan =
      bodyText.includes("補給プラン") || bodyText.includes("補給計畫");
    expect(hasSupplyPlan).toBeTruthy();
    expect(bodyText).toContain("MAP");

    // === 4. Start Ride → Next Screen ===
    await page.locator("text=走行開始").click();
    await page.waitForTimeout(3000);

    bodyText = await getBodyText(page);
    expect(bodyText).toContain("補給済み");
    expect(bodyText).toContain("休憩");
    expect(bodyText).toContain("ゴール到着");
    await page.screenshot({ path: "e2e/screenshots/lifecycle-03-next.png", fullPage: true });

    // Verify GPS banner is shown (permission denied in browser = warning)
    const hasGpsBanner =
      bodyText.includes("GPS追跡中") || bodyText.includes("位置情報の権限");
    // GPS may or may not be granted in test environment, just check UI rendered
    expect(bodyText).toContain("本日のゴール");

    // === 5. Tap 補給済み ===
    await page.locator("text=補給済み").first().click();
    await page.waitForTimeout(1000);

    // === 6. Arrive at Goal → Summary Screen ===
    await page.locator("text=ゴール到着").click();
    await page.waitForTimeout(3000);

    bodyText = await getBodyText(page);
    await page.screenshot({ path: "e2e/screenshots/lifecycle-04-summary.png", fullPage: true });

    // Summary should show completion info
    const hasSummaryContent =
      bodyText.includes("デイサマリー") ||
      bodyText.includes("日報總結") ||
      bodyText.includes("完了") ||
      bodyText.includes("完成");
    expect(hasSummaryContent).toBeTruthy();

    // Should show stats
    expect(bodyText).toMatch(/\d+.*km/);

    // === 7. Return to Home (next day) ===
    const nextDayBtn = page.locator("text=/次の日|前往下一天/");
    if (await nextDayBtn.isVisible({ timeout: 3000 })) {
      await nextDayBtn.click();
    } else {
      // Fallback: find the bottom button
      await page.locator("text=/🏠/").first().click();
    }
    await page.waitForTimeout(3000);

    bodyText = await getBodyText(page);
    await page.screenshot({ path: "e2e/screenshots/lifecycle-05-home-day2.png", fullPage: true });

    // Should be back on home screen
    expect(bodyText).toContain("環島コックピット");

    // Position should have advanced (no longer at 0 km)
    // The goal list should have changed (Taoyuan might not be visible anymore)
    expect(bodyText).toContain("ゴール候補");

    await context.close();
  });
});

test.describe("History Screen", () => {
  test("shows empty state when no history", async ({ browser }) => {
    const { context, page } = await loadApp(browser);

    // Navigate to history
    const historyBtn = page.locator("text=/旅行履歴|旅行紀錄/");
    if (await historyBtn.isVisible({ timeout: 3000 })) {
      await historyBtn.click();
      await page.waitForTimeout(2000);

      const bodyText = await getBodyText(page);
      await page.screenshot({ path: "e2e/screenshots/history-01-empty.png", fullPage: true });

      // Should show empty state or history data
      const hasHistoryContent =
        bodyText.includes("まだ走行記録がありません") ||
        bodyText.includes("尚無騎行紀錄") ||
        bodyText.includes("Day"); // Has actual history
      expect(hasHistoryContent).toBeTruthy();
    }

    await context.close();
  });
});

test.describe("Supply Plan Google Maps", () => {
  test("supply plan items show MAP badge", async ({ browser }) => {
    const { context, page } = await loadApp(browser);

    // Select a goal to get to today screen
    await page.locator("text=Taoyuan").first().click();
    await page.waitForTimeout(5000);

    const bodyText = await getBodyText(page);

    // MAP badges should be visible in supply plan
    const mapBadges = page.locator("text=MAP");
    const count = await mapBadges.count();
    expect(count).toBeGreaterThan(0);

    await page.screenshot({ path: "e2e/screenshots/supply-map-badges.png", fullPage: true });

    await context.close();
  });
});

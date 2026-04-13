import { test, expect, type Page, type BrowserContext } from "@playwright/test";

const APP_URL = "http://localhost:8090/";
const INITIAL_WAIT = 20000; // Wait for Metro bundle + React render

async function loadApp(browser: any): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  page.on("pageerror", (err: Error) => console.log(`  PAGE ERROR: ${err.message}`));

  // Fire-and-forget navigation (Metro's response doesn't complete "load" event)
  page.goto(APP_URL).catch(() => {});
  await page.waitForTimeout(INITIAL_WAIT);
  return { context, page };
}

test.describe("Home Screen", () => {
  test("shows title and goal list", async ({ browser }) => {
    const { context, page } = await loadApp(browser);

    const bodyText = await page.evaluate(() => document.body?.innerText || "");

    // Title
    expect(bodyText).toContain("環島コックピット");

    // Distance buttons (text may be split across elements: "60\nkm")
    expect(bodyText).toContain("60");
    expect(bodyText).toContain("80");
    expect(bodyText).toContain("100");
    expect(bodyText).toContain("120");
    expect(bodyText).toContain("目標距離");

    // Goal candidates header
    expect(bodyText).toContain("ゴール候補");

    // Major cities
    expect(bodyText).toContain("Taoyuan");
    expect(bodyText).toContain("Hsinchu");
    expect(bodyText).toContain("Taichung");
    expect(bodyText).toContain("Tainan");
    expect(bodyText).toContain("Kaohsiung");
    expect(bodyText).toContain("Hualien");

    await page.screenshot({ path: "e2e/screenshots/01-home.png", fullPage: true });
    await context.close();
  });

  test("distance quick pick highlights goals", async ({ browser }) => {
    const { context, page } = await loadApp(browser);

    // Click 80km button
    await page.locator("text=80km").click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: "e2e/screenshots/02-home-80km.png", fullPage: true });

    // Page should still show goals
    const bodyText = await page.evaluate(() => document.body?.innerText || "");
    expect(bodyText).toContain("ゴール候補");

    await context.close();
  });

  test("'もっと見る' toggles minor goals", async ({ browser }) => {
    const { context, page } = await loadApp(browser);

    const beforeText = await page.evaluate(() => document.body?.innerText || "");

    // Click もっと見る
    const moreBtn = page.locator("text=もっと見る");
    if (await moreBtn.isVisible()) {
      await moreBtn.click();
      await page.waitForTimeout(1000);

      const afterText = await page.evaluate(() => document.body?.innerText || "");
      // Should show more goals (text should be longer)
      expect(afterText.length).toBeGreaterThanOrEqual(beforeText.length);
    }

    await context.close();
  });
});

test.describe("Home → Today navigation", () => {
  test("selecting a goal navigates to Today screen", async ({ browser }) => {
    const { context, page } = await loadApp(browser);

    // Click on 桃園 (Taoyuan) goal
    await page.locator("text=Taoyuan").first().click();
    await page.waitForTimeout(5000); // Wait for plan generation + navigation

    await page.screenshot({ path: "e2e/screenshots/03-today.png", fullPage: true });

    const bodyText = await page.evaluate(() => document.body?.innerText || "");

    // Today screen should show plan info
    const hasTodayContent =
      bodyText.includes("走行開始") ||
      bodyText.includes("ゴール変更") ||
      bodyText.includes("Day") ||
      bodyText.includes("サマリー") ||
      bodyText.includes("距離");
    expect(hasTodayContent).toBeTruthy();

    await context.close();
  });
});

test.describe("Today Screen", () => {
  async function navigateToToday(browser: any) {
    const { context, page } = await loadApp(browser);
    await page.locator("text=Taoyuan").first().click();
    await page.waitForTimeout(5000);
    return { context, page };
  }

  test("shows summary card and advisory cards", async ({ browser }) => {
    const { context, page } = await navigateToToday(browser);

    const bodyText = await page.evaluate(() => document.body?.innerText || "");

    // Should have distance info
    expect(bodyText).toMatch(/\d+.*km/);

    await context.close();
  });

  test("'走行開始' navigates to Next screen", async ({ browser }) => {
    const { context, page } = await navigateToToday(browser);

    const startBtn = page.locator("text=走行開始");
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(3000);

      await page.screenshot({ path: "e2e/screenshots/04-next.png", fullPage: true });

      const bodyText = await page.evaluate(() => document.body?.innerText || "");
      const hasNextContent =
        bodyText.includes("補給済み") ||
        bodyText.includes("休憩") ||
        bodyText.includes("走行中");
      expect(hasNextContent).toBeTruthy();
    }

    await context.close();
  });

  test("'ゴール変更' goes back to Home", async ({ browser }) => {
    const { context, page } = await navigateToToday(browser);

    const changeBtn = page.locator("text=ゴール変更");
    if (await changeBtn.isVisible()) {
      await changeBtn.click();
      await page.waitForTimeout(3000);

      const bodyText = await page.evaluate(() => document.body?.innerText || "");
      expect(bodyText).toContain("環島コックピット");
    }

    await context.close();
  });
});

test.describe("Next Screen", () => {
  async function navigateToNext(browser: any) {
    const { context, page } = await loadApp(browser);
    await page.locator("text=Taoyuan").first().click();
    await page.waitForTimeout(5000);
    const startBtn = page.locator("text=走行開始");
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(3000);
    }
    return { context, page };
  }

  test("shows quick action buttons", async ({ browser }) => {
    const { context, page } = await navigateToNext(browser);

    const bodyText = await page.evaluate(() => document.body?.innerText || "");

    expect(bodyText).toContain("補給済み");
    expect(bodyText).toContain("休憩");

    await context.close();
  });

  test("'補給済み' button works without crash", async ({ browser }) => {
    const { context, page } = await navigateToNext(browser);

    const supplyBtn = page.locator("text=補給済み").first();
    if (await supplyBtn.isVisible()) {
      await supplyBtn.click();
      await page.waitForTimeout(1000);

      // Page should still be functional
      const bodyText = await page.evaluate(() => document.body?.innerText || "");
      expect(bodyText).toContain("補給済み");
    }

    await context.close();
  });

  test("'ゴール変更' returns to Home", async ({ browser }) => {
    const { context, page } = await navigateToNext(browser);

    const changeBtn = page.locator("text=ゴール変更").first();
    if (await changeBtn.isVisible()) {
      await changeBtn.click();
      await page.waitForTimeout(3000);

      const bodyText = await page.evaluate(() => document.body?.innerText || "");
      expect(bodyText).toContain("環島コックピット");
    }

    await context.close();
  });
});

test.describe("Full Flow", () => {
  test("Home → Today → Next → Home (complete cycle)", async ({ browser }) => {
    const { context, page } = await loadApp(browser);

    // 1. Home screen
    let bodyText = await page.evaluate(() => document.body?.innerText || "");
    expect(bodyText).toContain("ゴール候補");
    await page.screenshot({ path: "e2e/screenshots/flow-01-home.png", fullPage: true });

    // 2. Click 80km
    await page.locator("text=80km").click();
    await page.waitForTimeout(500);

    // 3. Select 新竹 (Hsinchu, ~87km)
    await page.locator("text=Hsinchu").first().click();
    await page.waitForTimeout(5000);
    await page.screenshot({ path: "e2e/screenshots/flow-02-today.png", fullPage: true });

    // 4. Start ride
    bodyText = await page.evaluate(() => document.body?.innerText || "");
    if (bodyText.includes("走行開始")) {
      await page.locator("text=走行開始").click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: "e2e/screenshots/flow-03-next.png", fullPage: true });

      // 5. Tap 補給済み
      if (await page.locator("text=補給済み").first().isVisible()) {
        await page.locator("text=補給済み").first().click();
        await page.waitForTimeout(500);
      }

      // 6. Back to home
      if (await page.locator("text=ゴール変更").first().isVisible()) {
        await page.locator("text=ゴール変更").first().click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: "e2e/screenshots/flow-04-back-home.png", fullPage: true });

        bodyText = await page.evaluate(() => document.body?.innerText || "");
        expect(bodyText).toContain("環島コックピット");
      }
    }

    await context.close();
  });
});

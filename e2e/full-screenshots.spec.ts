import { test } from "@playwright/test";

const APP = "http://localhost:8090/";

async function load(browser: any) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  page.goto(APP).catch(() => {});
  await page.waitForTimeout(25000);
  return { ctx, page };
}

async function scrollDown(page: any, times = 5) {
  await page.mouse.move(195, 400);
  for (let i = 0; i < times; i++) { await page.mouse.wheel(0, 300); await page.waitForTimeout(100); }
  await page.waitForTimeout(500);
}

test("All screens", async ({ browser }) => {
  const { ctx, page } = await load(browser);

  // 1. Home
  await page.screenshot({ path: "e2e/screenshots/all-01-home.png" });

  // 2. Position Adjuster
  await page.locator("text=変更").first().click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "e2e/screenshots/all-02-position.png" });
  // Close modal
  await page.locator("text=キャンセル").first().click().catch(() => {});
  await page.waitForTimeout(500);

  // 3. Trip Planner
  await page.locator("text=旅程プラン").first().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "e2e/screenshots/all-03-plan-empty.png" });

  // Auto generate
  await page.locator("text=自動生成").first().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "e2e/screenshots/all-04-plan-top.png" });

  await scrollDown(page, 5);
  await page.screenshot({ path: "e2e/screenshots/all-05-plan-mid.png" });

  await scrollDown(page, 10);
  await page.screenshot({ path: "e2e/screenshots/all-06-plan-bottom.png" });

  // Go back to home
  await page.goBack();
  await page.waitForTimeout(2000);

  // 4. Select goal → Today
  await page.locator("text=Hsinchu").first().click();
  await page.waitForTimeout(5000);
  await page.screenshot({ path: "e2e/screenshots/all-07-today-top.png" });

  await scrollDown(page, 8);
  await page.screenshot({ path: "e2e/screenshots/all-08-today-bottom.png" });

  // 5. Start ride → Next
  // Scroll back up to find the button
  await page.mouse.move(195, 400);
  for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, -300); await page.waitForTimeout(100); }
  await page.waitForTimeout(500);

  const startBtn = page.locator("text=走行開始");
  if (await startBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await startBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "e2e/screenshots/all-09-next-top.png" });

    await scrollDown(page, 5);
    await page.screenshot({ path: "e2e/screenshots/all-10-next-bottom.png" });
  }

  await ctx.close();
});

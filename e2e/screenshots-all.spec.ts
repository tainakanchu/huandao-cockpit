import { test } from "@playwright/test";

const APP_URL = "http://localhost:8090/";

async function loadApp(browser: any) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.goto(APP_URL).catch(() => {});
  await page.waitForTimeout(25000);
  return { context, page };
}

test("Trip Planner: auto-generate and scroll", async ({ browser }) => {
  const { context, page } = await loadApp(browser);

  // Go to plan screen
  await page.locator("text=Trip Plan").first().click();
  await page.waitForTimeout(3000);

  // Click 自動生成
  await page.locator("text=自動生成").first().click();
  await page.waitForTimeout(2000);

  await page.screenshot({ path: "e2e/screenshots/plan-generated-top.png" });

  // Scroll down to see more days
  await page.mouse.move(195, 400);
  for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, 300); await page.waitForTimeout(100); }
  await page.waitForTimeout(500);
  await page.screenshot({ path: "e2e/screenshots/plan-generated-mid.png" });

  // Scroll more
  for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, 300); await page.waitForTimeout(100); }
  await page.waitForTimeout(500);
  await page.screenshot({ path: "e2e/screenshots/plan-generated-bottom.png" });

  // Print plan content
  const body = await page.evaluate(() => document.body?.innerText || "");
  console.log(body.substring(0, 2000));

  await context.close();
});

test("Summary screen after ride", async ({ browser }) => {
  const { context, page } = await loadApp(browser);

  // Select Taoyuan → Today → Start → back to summary flow is complex
  // Instead navigate directly: select goal, go to today, ride, then summary
  await page.locator("text=Taoyuan").first().click();
  await page.waitForTimeout(5000);

  // Start ride
  const startBtn = page.locator("text=走行開始");
  if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await startBtn.click();
    await page.waitForTimeout(2000);

    // Go to summary via URL
    await page.evaluate(() => { window.location.hash = "/summary"; });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: "e2e/screenshots/summary.png" });

    // Scroll down
    await page.mouse.move(195, 400);
    for (let i = 0; i < 5; i++) { await page.mouse.wheel(0, 300); await page.waitForTimeout(100); }
    await page.waitForTimeout(500);
    await page.screenshot({ path: "e2e/screenshots/summary-scrolled.png" });
  }

  await context.close();
});

import { test, expect } from "@playwright/test";

test("Today screen with elevation chart", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  page.on("pageerror", (err) => console.log(`PAGE ERROR: ${err.message}`));

  // Load app
  page.goto("http://localhost:8090/").catch(() => {});
  await page.waitForTimeout(20000);

  // Select 新竹 (Hsinchu, ~87km - has interesting elevation profile)
  await page.locator("text=Hsinchu").first().click();
  await page.waitForTimeout(5000);

  // Take full-page screenshot of Today screen
  await page.screenshot({
    path: "e2e/screenshots/today-elevation.png",
    fullPage: true,
  });

  // Verify elevation chart is present
  const bodyText = await page.evaluate(() => document.body?.innerText || "");
  expect(bodyText).toContain("高低差プロファイル");

  console.log("Today screen body includes elevation chart:");
  console.log(bodyText.substring(0, 800));

  // Now try a longer route (花蓮 Hualien) to see bigger elevation changes
  // Go back to home
  const changeBtn = page.locator("text=ゴール変更");
  if (await changeBtn.isVisible()) {
    await changeBtn.click();
    await page.waitForTimeout(3000);
  }

  // Show minor goals to get more options
  const moreBtn = page.locator("text=もっと見る");
  if (await moreBtn.isVisible()) {
    await moreBtn.click();
    await page.waitForTimeout(500);
  }

  // Select 花蓮 (Hualien, ~724km - includes 壽卡 and 蘇花公路!)
  await page.locator("text=Hualien").first().click();
  await page.waitForTimeout(5000);

  await page.screenshot({
    path: "e2e/screenshots/today-elevation-hualien.png",
    fullPage: true,
  });

  await context.close();
});

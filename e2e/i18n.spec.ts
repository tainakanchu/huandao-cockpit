import { test } from "@playwright/test";

const APP = "http://localhost:8090/";

test("Language switch: ja → zh-TW → ja", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  page.goto(APP).catch(() => {});
  await page.waitForTimeout(25000);

  // Screenshot in Japanese (default)
  await page.screenshot({ path: "e2e/screenshots/i18n-ja.png" });

  // Find and click the language switcher (shows "繁中" when in ja mode)
  const switcher = page.locator("text=繁中").first();
  if (await switcher.isVisible({ timeout: 5000 }).catch(() => false)) {
    await switcher.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "e2e/screenshots/i18n-zhtw.png" });

    // Switch back
    const switchBack = page.locator("text=日本語").first();
    if (await switchBack.isVisible({ timeout: 3000 }).catch(() => false)) {
      await switchBack.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: "e2e/screenshots/i18n-ja-back.png" });
    }
  }

  const body = await page.evaluate(() => document.body?.innerText || "");
  console.log(`Final body (first 300):\n${body.substring(0, 300)}`);

  await ctx.close();
});

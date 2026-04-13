import { test, expect } from "@playwright/test";

test("Scroll to elevation chart", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  page.on("pageerror", (err) => console.log(`PAGE ERROR: ${err.message}`));

  page.goto("http://localhost:8090/").catch(() => {});
  await page.waitForTimeout(20000);

  // Select Hsinchu
  await page.locator("text=Hsinchu").first().click();
  await page.waitForTimeout(5000);

  // Screenshot the top section
  await page.screenshot({ path: "e2e/screenshots/today-top.png" });

  // Scroll down within the React Native ScrollView
  // RN Web renders ScrollView as a div with overflow: auto/scroll
  await page.evaluate(() => {
    const scrollables = document.querySelectorAll('[data-testid], [style*="overflow"]');
    // Find the main scrollable container
    const all = Array.from(document.querySelectorAll('div'));
    for (const div of all) {
      const style = window.getComputedStyle(div);
      if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && div.scrollHeight > div.clientHeight) {
        div.scrollTop = div.scrollHeight; // Scroll to bottom
        return;
      }
    }
  });
  await page.waitForTimeout(500);

  // Screenshot after scroll
  await page.screenshot({ path: "e2e/screenshots/today-bottom.png" });

  // Also try mouse wheel scroll
  await page.mouse.move(195, 400);
  for (let i = 0; i < 15; i++) {
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(500);

  await page.screenshot({ path: "e2e/screenshots/today-scrolled.png" });

  // Check SVG presence
  const svgCount = await page.evaluate(() => document.querySelectorAll('svg').length);
  console.log(`SVG count: ${svgCount}`);

  const bodyText = await page.evaluate(() => document.body?.innerText || "");
  expect(bodyText).toContain("高低差プロファイル");

  await context.close();
});

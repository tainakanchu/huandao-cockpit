import { test, expect } from "@playwright/test";

test("debug: load app via static HTML", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();

  const consoleLogs: string[] = [];
  page.on("console", (msg) => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on("pageerror", (err) => console.log(`  PAGE ERROR: ${err.message}`));

  console.log("Loading static HTML (triggers Metro bundle load)...");
  // Load our custom HTML which loads the bundle from Metro
  page.goto("http://localhost:8090/").catch(() => {});

  // Wait long enough for Metro to bundle (first time can take 15-30s)
  console.log("Waiting 45s for bundle + React render...");
  await page.waitForTimeout(45000);

  // Take screenshot via buffer (not file path, to avoid font wait)
  const buf = await page.screenshot({ fullPage: true }).catch(() => null);
  if (buf) {
    const fs = require("fs");
    fs.writeFileSync("e2e/screenshots/debug-page.png", buf);
    console.log("Screenshot saved to e2e/screenshots/debug-page.png");
  } else {
    console.log("Screenshot failed");
  }

  // Get rendered content
  const bodyText = await page
    .evaluate(() => document.body?.innerText || "(empty)")
    .catch((e) => `(eval error: ${e.message})`);
  console.log(`\nBody text (first 1500 chars):\n${bodyText.substring(0, 1500)}`);

  // Print errors from console
  const errors = consoleLogs.filter((l) => l.startsWith("[error]"));
  if (errors.length > 0) {
    console.log(`\n${errors.length} browser errors:`);
    errors.slice(0, 10).forEach((e) => console.log(`  ${e}`));
  }

  console.log(`\nTotal browser console messages: ${consoleLogs.length}`);
  consoleLogs.slice(0, 15).forEach((l) => console.log(`  ${l}`));

  // Verify something rendered
  expect(bodyText.length).toBeGreaterThan(10);

  await context.close();
});

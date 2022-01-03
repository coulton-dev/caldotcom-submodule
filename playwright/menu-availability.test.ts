import { test, expect } from "@playwright/test";

// Using logged in state from globalSteup
test.use({ storageState: "playwright/artifacts/proStorageState.json" });

test("test menu availability", async ({ page }) => {
  // Try to go homepage
  await page.goto("/");
  // It should redirect you to the event-types page
  await page.waitForSelector("[data-testid=event-types]");
  await page.goto('/availability');
  let pageTitle = await page.title();
  expect(pageTitle).toMatch('Availability');
});

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { loginAndGo, setupUnauthenticated } from "./helpers/auth";
import { mockBackendRoutes } from "./helpers/api-mocks";

test.describe("Accessibility", () => {
  test("landing page has no critical violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(results.violations.filter((v) => v.impact === "critical")).toHaveLength(0);
  });

  test("register page has no critical violations", async ({ page }) => {
    await mockBackendRoutes(page);
    await page.goto("/register");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(results.violations.filter((v) => v.impact === "critical")).toHaveLength(0);
  });

  test("PIN gate has no critical violations", async ({ page }) => {
    await setupUnauthenticated(page);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(results.violations.filter((v) => v.impact === "critical")).toHaveLength(0);
  });

  test("dashboard overview has no critical violations", async ({ page }) => {
    await loginAndGo(page, "/dashboard");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(results.violations.filter((v) => v.impact === "critical")).toHaveLength(0);
  });

  test("graduates page has no critical violations", async ({ page }) => {
    await loginAndGo(page, "/dashboard/graduates");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(results.violations.filter((v) => v.impact === "critical")).toHaveLength(0);
  });

  test("upload page has no critical violations", async ({ page }) => {
    await loginAndGo(page, "/dashboard/upload");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(results.violations.filter((v) => v.impact === "critical")).toHaveLength(0);
  });

  test("settings page has no critical violations", async ({ page }) => {
    await loginAndGo(page, "/dashboard/settings");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(results.violations.filter((v) => v.impact === "critical")).toHaveLength(0);
  });

  test("all images on landing page have alt text", async ({ page }) => {
    await page.goto("/");
    const imagesWithoutAlt = await page.locator("img:not([alt])").count();
    expect(imagesWithoutAlt).toBe(0);
  });

  test("PIN gate form is keyboard navigable", async ({ page }) => {
    await setupUnauthenticated(page);
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(["INPUT", "BUTTON", "A"]).toContain(focused);
  });

  test("register form step 1 is keyboard navigable", async ({ page }) => {
    await mockBackendRoutes(page);
    await page.goto("/register");
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(["INPUT", "BUTTON", "A"]).toContain(focused);
  });
});

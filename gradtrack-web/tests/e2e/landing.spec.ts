import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("page loads with correct title", async ({ page }) => {
    await expect(page).toHaveTitle(/GradTrack Analytics/);
  });

  test("navbar renders MUST logo and brand name", async ({ page }) => {
    await expect(page.locator(".navbar-logo")).toContainText("MUST");
    await expect(page.locator(".navbar-title")).toContainText("GradTrack Analytics");
  });

  test("navbar Submit Data link navigates to /register", async ({ page }) => {
    await page.click("a.navbar-cta");
    await expect(page).toHaveURL(/\/register/);
  });

  test("navbar Dashboard link navigates to /dashboard", async ({ page }) => {
    await page.click("nav a[href='/dashboard']");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("hero section renders headline", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Unlock");
    await expect(page.locator("h1")).toContainText("Graduate");
    await expect(page.locator("h1")).toContainText("Employability Insights");
  });

  test("hero I'm a Graduate CTA navigates to /register", async ({ page }) => {
    await page.click(".hero-actions .btn-primary");
    await expect(page).toHaveURL(/\/register/);
  });

  test("hero Committee Dashboard CTA navigates to /dashboard", async ({ page }) => {
    await page.click(".hero-actions .btn-outline");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("features section renders 6 feature cards", async ({ page }) => {
    await expect(page.locator(".feature-card")).toHaveCount(6);
  });

  test("stats band renders 4 statistics", async ({ page }) => {
    const stats = page.locator(".stat-item");
    await expect(stats).toHaveCount(4);
    await expect(page.locator(".stats-grid")).toContainText("12,400+");
    await expect(page.locator(".stats-grid")).toContainText("87%");
    await expect(page.locator(".stats-grid")).toContainText("340+");
    await expect(page.locator(".stats-grid")).toContainText("18");
  });

  test("How It Works section renders 4 steps", async ({ page }) => {
    await expect(page.locator(".step-card")).toHaveCount(4);
    await expect(page.locator(".step-number").first()).toContainText("01");
    await expect(page.locator(".step-number").last()).toContainText("04");
  });

  test("testimonials section renders 3 cards", async ({ page }) => {
    await expect(page.locator(".testimonial-card")).toHaveCount(3);
    await expect(page.locator(".testimonial-name").first()).toContainText("Brian Mutua");
  });

  test("trend cards render 5 roles", async ({ page }) => {
    await expect(page.locator(".trend-card")).toHaveCount(5);
    await expect(page.locator(".trend-rank").first()).toContainText("#1");
    await expect(page.locator(".trend-rank").last()).toContainText("#5");
  });

  test("CTA section renders two role cards", async ({ page }) => {
    await expect(page.locator(".role-cta-card")).toHaveCount(2);
    await expect(page.locator(".role-cta-card").first()).toContainText("I'm a Graduate");
    await expect(page.locator(".role-cta-card").last()).toContainText("School Committee");
  });

  test("footer renders column headings", async ({ page }) => {
    await expect(page.locator("footer")).toContainText("Platform");
    await expect(page.locator("footer")).toContainText("University");
    await expect(page.locator("footer")).toContainText("Resources");
  });

  test("footer copyright contains current year", async ({ page }) => {
    const year = new Date().getFullYear().toString();
    await expect(page.locator(".footer-bottom")).toContainText(year);
  });

  test("theme toggle button is present and clickable", async ({ page }) => {
    const toggle = page.locator("button[aria-label='Toggle theme']");
    await expect(toggle).toBeVisible();
    await toggle.click();
  });

  test("page has no horizontal overflow at 1280px", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5);
  });
});

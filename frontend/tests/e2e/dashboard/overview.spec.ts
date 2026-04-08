import { test, expect } from "@playwright/test";
import { loginAndGo } from "../helpers/auth";

test.describe("Dashboard Overview", () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGo(page, "/dashboard");
  });

  // ── Layout ──────────────────────────────────────────────────────────────────

  test("sidebar visible on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator("aside, nav").filter({ hasText: /Overview/ }).first()).toBeVisible();
  });

  test("header renders MUST logo", async ({ page }) => {
    await expect(page.locator("header").filter({ hasText: /MUST/ }).first()).toBeVisible();
  });

  // ── KPI cards ───────────────────────────────────────────────────────────────

  test("Total Graduates KPI card is visible", async ({ page }) => {
    await expect(page.getByText("Total Graduates")).toBeVisible();
  });

  test("Employed KPI card is visible", async ({ page }) => {
    await expect(page.getByText("Employed")).toBeVisible();
  });

  test("Seeking Work KPI card is visible", async ({ page }) => {
    await expect(page.getByText("Seeking Work")).toBeVisible();
  });

  test("Further Studies KPI card is visible", async ({ page }) => {
    await expect(page.getByText("Further Studies")).toBeVisible();
  });

  test("Unique Employers KPI card is visible", async ({ page }) => {
    await expect(page.getByText("Unique Employers")).toBeVisible();
  });

  // ── Filters ─────────────────────────────────────────────────────────────────

  test("School filter dropdown is present", async ({ page }) => {
    await expect(page.getByRole("combobox", { name: /School/ })).toBeVisible();
  });

  test("Year filter dropdown is present", async ({ page }) => {
    await expect(page.getByRole("combobox", { name: /Year/ })).toBeVisible();
  });

  test("Status filter dropdown is present", async ({ page }) => {
    await expect(page.getByRole("combobox", { name: /Status/ })).toBeVisible();
  });

  test("Clear button appears when filter active", async ({ page }) => {
    await page.getByRole("combobox", { name: /School/ }).selectOption("sci");
    await expect(page.getByRole("button", { name: /Clear/ })).toBeVisible();
  });

  // ── Tabs ────────────────────────────────────────────────────────────────────

  test("5 tabs render", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Overview/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Employment/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Academic/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Trends/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Compare Years/ })).toBeVisible();
  });

  test("Employment tab shows sector chart", async ({ page }) => {
    await page.getByRole("button", { name: /Employment/ }).click();
    await expect(page.getByText("By Sector")).toBeVisible();
  });

  test("Academic tab shows school and department charts", async ({ page }) => {
    await page.getByRole("button", { name: /Academic/ }).click();
    await expect(page.getByText("By School")).toBeVisible();
    await expect(page.getByText("By Department")).toBeVisible();
  });

  test("Trends tab shows area chart", async ({ page }) => {
    await page.getByRole("button", { name: /Trends/ }).click();
    await expect(page.getByText("Graduation & Employment Trends")).toBeVisible();
  });

  // ── Compare Years tab ────────────────────────────────────────────────────────

  test("Compare Years tab shows empty state when no years selected", async ({ page }) => {
    await page.getByRole("button", { name: /Compare Years/ }).click();
    await expect(page.getByText("Select two graduation years to compare")).toBeVisible();
  });

  test("Year A and Year B selects are present", async ({ page }) => {
    await page.getByRole("button", { name: /Compare Years/ }).click();
    await expect(page.getByText("Year A")).toBeVisible();
    await expect(page.getByText("Year B")).toBeVisible();
  });

  test("selecting both years shows KPI delta cards", async ({ page }) => {
    await page.getByRole("button", { name: /Compare Years/ }).click();
    // Select year A
    await page.locator("select.border-blue-400").selectOption("2022");
    // Select year B
    await page.locator("select.border-green-500").selectOption("2023");
    await expect(page.getByText("Total Graduates").first()).toBeVisible();
    await expect(page.getByText("Employment Rate").first()).toBeVisible();
  });

  test("Clear button resets both year selects", async ({ page }) => {
    await page.getByRole("button", { name: /Compare Years/ }).click();
    await page.locator("select.border-blue-400").selectOption("2022");
    await page.locator("select.border-green-500").selectOption("2023");
    await page.getByRole("button", { name: /✕ Clear/ }).last().click();
    await expect(page.locator("select.border-blue-400")).toHaveValue("");
    await expect(page.locator("select.border-green-500")).toHaveValue("");
  });

  test("Employment Status Overview chart is visible on overview tab", async ({ page }) => {
    await expect(page.getByText("Employment Status Overview")).toBeVisible();
  });
});

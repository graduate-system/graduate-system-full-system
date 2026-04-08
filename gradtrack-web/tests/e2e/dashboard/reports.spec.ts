import { test, expect } from "@playwright/test";
import { loginAndGo } from "../helpers/auth";

test.describe("Reports Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGo(page, "/dashboard/reports");
  });

  test("page heading Reports is visible", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible();
  });

  test("filter panel renders school select", async ({ page }) => {
    await expect(page.getByText("School / Faculty")).toBeVisible();
  });

  test("filter panel renders year range selects", async ({ page }) => {
    await expect(page.getByText("Year From")).toBeVisible();
    await expect(page.getByText("Year To")).toBeVisible();
  });

  test("scope card shows graduate count", async ({ page }) => {
    await expect(page.getByText("Graduates")).toBeVisible();
    await expect(page.getByText("3")).toBeVisible();
  });

  test("scope card shows employment rate", async ({ page }) => {
    await expect(page.getByText("Employment Rate")).toBeVisible();
    await expect(page.getByText("33%")).toBeVisible();
  });

  test("selecting a school shows filter tag", async ({ page }) => {
    await page.locator("select").filter({ hasText: /All Schools/ }).selectOption("sci");
    await expect(page.getByText("School:")).toBeVisible();
  });

  test("clicking × on filter tag removes it", async ({ page }) => {
    await page.locator("select").filter({ hasText: /All Schools/ }).selectOption("sci");
    await page.getByRole("button", { name: "×" }).click();
    await expect(page.getByText("School:")).not.toBeVisible();
  });

  test("Clear all filters button clears all filters", async ({ page }) => {
    await page.locator("select").filter({ hasText: /All Schools/ }).selectOption("sci");
    await page.getByRole("button", { name: /Clear all filters/ }).click();
    await expect(page.getByText("School:")).not.toBeVisible();
  });

  test("Year From constrains Year To options", async ({ page }) => {
    await page.locator("select").filter({ hasText: /^Any$/ }).first().selectOption("2023");
    // Year To should not have options before 2023
    const yearToSelect = page.locator("select").filter({ hasText: /^Any$/ }).last();
    const option2022 = yearToSelect.locator("option[value='2022']");
    await expect(option2022).toHaveCount(0);
  });

  test("Generate Report button is present and enabled", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Generate Report/ })).toBeEnabled();
  });

  test("clicking Generate shows loading state then report", async ({ page }) => {
    await page.getByRole("button", { name: /Generate Report/ }).click();
    // Report sections should appear
    await expect(page.getByText("Report Summary")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Executive Summary")).toBeVisible();
    await expect(page.getByText("Key Findings")).toBeVisible();
    await expect(page.getByText("Trends Analysis")).toBeVisible();
    await expect(page.getByText("Recommendations")).toBeVisible();
  });

  test("generated report shows scope header", async ({ page }) => {
    await page.getByRole("button", { name: /Generate Report/ }).click();
    await expect(page.getByText("All Graduates")).toBeVisible({ timeout: 10_000 });
  });

  test("generated report shows Data Summary tables", async ({ page }) => {
    await page.getByRole("button", { name: /Generate Report/ }).click();
    await expect(page.getByText("Data Summary")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Employment Status")).toBeVisible();
    await expect(page.getByText("Year-on-Year Trend")).toBeVisible();
  });

  test("Edit with AI button opens instruction input", async ({ page }) => {
    await page.getByRole("button", { name: /Generate Report/ }).click();
    await expect(page.getByText("Executive Summary")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /Edit with AI/ }).first().click();
    await expect(page.getByPlaceholder(/Make it more concise/)).toBeVisible();
  });

  test("cancelling edit closes instruction input", async ({ page }) => {
    await page.getByRole("button", { name: /Generate Report/ }).click();
    await expect(page.getByText("Executive Summary")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /Edit with AI/ }).first().click();
    await page.getByRole("button", { name: /✕ Cancel/ }).click();
    await expect(page.getByPlaceholder(/Make it more concise/)).not.toBeVisible();
  });

  test("Download PDF button is present after generation", async ({ page }) => {
    await page.getByRole("button", { name: /Generate Report/ }).click();
    await expect(page.getByRole("button", { name: /Download PDF/ })).toBeVisible({ timeout: 10_000 });
  });

  test("Download Excel button is present after generation", async ({ page }) => {
    await page.getByRole("button", { name: /Generate Report/ }).click();
    await expect(page.getByRole("button", { name: /Download Excel/ })).toBeVisible({ timeout: 10_000 });
  });
});

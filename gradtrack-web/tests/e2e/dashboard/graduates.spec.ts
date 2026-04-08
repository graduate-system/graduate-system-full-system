import { test, expect } from "@playwright/test";
import { loginAndGo } from "../helpers/auth";

test.describe("Graduates Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGo(page, "/dashboard/graduates");
  });

  test("page heading Graduates is visible", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Graduates" })).toBeVisible();
  });

  test("search input renders with placeholder", async ({ page }) => {
    await expect(page.getByPlaceholder(/Search name/)).toBeVisible();
  });

  test("table renders with correct column headers", async ({ page }) => {
    await expect(page.getByRole("columnheader", { name: "Name" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Campus" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "School" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Employer" })).toBeVisible();
  });

  test("table shows rows from mock data", async ({ page }) => {
    await expect(page.getByRole("cell", { name: "Jane Wanjiru" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Brian Mutua" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Grace Njiru" })).toBeVisible();
  });

  test("searching by name filters table rows", async ({ page }) => {
    await page.getByPlaceholder(/Search name/).fill("Jane");
    await expect(page.getByRole("cell", { name: "Jane Wanjiru" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Brian Mutua" })).not.toBeVisible();
  });

  test("clearing search restores all rows", async ({ page }) => {
    await page.getByPlaceholder(/Search name/).fill("Jane");
    await page.getByPlaceholder(/Search name/).clear();
    await expect(page.getByRole("cell", { name: "Brian Mutua" })).toBeVisible();
  });

  test("result count updates with search", async ({ page }) => {
    await page.getByPlaceholder(/Search name/).fill("Jane");
    await expect(page.getByText("1 result")).toBeVisible();
  });

  test("Clear all button clears all filters", async ({ page }) => {
    await page.getByPlaceholder(/Search name/).fill("Jane");
    await expect(page.getByRole("button", { name: /Clear all/ })).toBeVisible();
    await page.getByRole("button", { name: /Clear all/ }).click();
    await expect(page.getByText("3 results")).toBeVisible();
  });

  test("clicking a table row opens detail dialog", async ({ page }) => {
    await page.getByRole("cell", { name: "Jane Wanjiru" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog")).toContainText("Jane Wanjiru");
  });

  test("detail dialog shows Personal Details section", async ({ page }) => {
    await page.getByRole("cell", { name: "Jane Wanjiru" }).click();
    await expect(page.getByText("Personal Details")).toBeVisible();
  });

  test("detail dialog shows Academic Details section", async ({ page }) => {
    await page.getByRole("cell", { name: "Jane Wanjiru" }).click();
    await expect(page.getByText("Academic Details")).toBeVisible();
  });

  test("detail dialog shows Employment Details section", async ({ page }) => {
    await page.getByRole("cell", { name: "Jane Wanjiru" }).click();
    await expect(page.getByText("Employment Details")).toBeVisible();
  });

  test("detail dialog closes on Escape key", async ({ page }) => {
    await page.getByRole("cell", { name: "Jane Wanjiru" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("LinkedIn URL in dialog is a clickable link", async ({ page }) => {
    await page.getByRole("cell", { name: "Jane Wanjiru" }).click();
    const link = page.getByRole("dialog").getByRole("link", { name: /linkedin/ });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", /linkedin\.com/);
  });

  test("sorting by Name column changes row order", async ({ page }) => {
    await page.getByRole("columnheader", { name: "Name" }).click();
    const firstRow = page.getByRole("row").nth(1);
    await expect(firstRow).toContainText(/Brian|Grace|Jane/);
  });

  test("Export CSV button is present", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Export CSV/ })).toBeVisible();
  });

  test("no results message shown when search matches nothing", async ({ page }) => {
    await page.getByPlaceholder(/Search name/).fill("zzznomatch");
    await expect(page.getByText("No graduates found")).toBeVisible();
  });
});

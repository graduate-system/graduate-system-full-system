import { test, expect } from "@playwright/test";
import { loginAndGo } from "../helpers/auth";
import path from "path";
import fs from "fs";
import os from "os";

test.describe("Upload Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGo(page, "/dashboard/upload");
  });

  // ── Mode toggle ─────────────────────────────────────────────────────────────

  test("two mode buttons render", async ({ page }) => {
    await expect(page.getByText("Single Entry")).toBeVisible();
    await expect(page.getByText("Bulk Upload")).toBeVisible();
  });

  test("clicking Bulk Upload switches mode", async ({ page }) => {
    await page.getByText("Bulk Upload").click();
    await expect(page.getByText("Drop file here or click to browse")).toBeVisible();
  });

  // ── Single Entry form ────────────────────────────────────────────────────────

  test("single entry form renders required fields", async ({ page }) => {
    await expect(page.getByText("Full Name *")).toBeVisible();
    await expect(page.getByText("Campus *")).toBeVisible();
    await expect(page.getByText("School *")).toBeVisible();
    await expect(page.getByText("Employment Status *")).toBeVisible();
  });

  test("full name with numbers shows error", async ({ page }) => {
    await page.getByLabel(/Full Name/).fill("123 Jane");
    await page.getByRole("button", { name: /Add Graduate/ }).click();
    await expect(page.getByText(/letters only/)).toBeVisible();
  });

  test("missing full name shows error", async ({ page }) => {
    await page.getByRole("button", { name: /Add Graduate/ }).click();
    await expect(page.getByText("Full name is required")).toBeVisible();
  });

  test("missing email and phone shows error", async ({ page }) => {
    await page.getByLabel(/Full Name/).fill("Jane Wanjiru");
    // Fill other required fields
    await page.locator("select[name='campus']").selectOption("Main Campus (Nchiru)");
    await page.locator("select[name='school']").selectOption("sci");
    await page.waitForTimeout(300);
    await page.locator("select[name='department']").selectOption("cs");
    await page.waitForTimeout(300);
    await page.locator("select[name='programme']").selectOption("Bachelor of Science (Computer Science)");
    await page.locator("select[name='graduation_year']").selectOption("2023");
    await page.locator("select[name='employment_status']").selectOption("Unemployed — Seeking");
    await page.getByRole("button", { name: /Add Graduate/ }).click();
    await expect(page.getByText(/at least an email or phone/)).toBeVisible();
  });

  test("successful single entry shows success banner", async ({ page }) => {
    await page.getByLabel(/Full Name/).fill("Jane Wanjiru");
    await page.locator("input[name='email']").fill("jane@example.com");
    await page.locator("select[name='campus']").selectOption("Main Campus (Nchiru)");
    await page.locator("select[name='school']").selectOption("sci");
    await page.waitForTimeout(300);
    await page.locator("select[name='department']").selectOption("cs");
    await page.waitForTimeout(300);
    await page.locator("select[name='programme']").selectOption("Bachelor of Science (Computer Science)");
    await page.locator("select[name='graduation_year']").selectOption("2023");
    await page.locator("select[name='employment_status']").selectOption("Unemployed — Seeking");
    await page.getByRole("button", { name: /Add Graduate/ }).click();
    await expect(page.getByText(/Graduate added successfully/)).toBeVisible();
  });

  // ── Bulk Upload ──────────────────────────────────────────────────────────────

  test("drop zone renders with correct hint text", async ({ page }) => {
    await page.getByText("Bulk Upload").click();
    await expect(page.getByText("Accepts .csv, .xlsx, .xls")).toBeVisible();
  });

  test("Download Template button is present", async ({ page }) => {
    await page.getByText("Bulk Upload").click();
    await expect(page.getByRole("button", { name: /Download Template/ })).toBeVisible();
  });

  test("uploading a non-CSV file shows error", async ({ page }) => {
    await page.getByText("Bulk Upload").click();
    // Create a temp txt file
    const tmpFile = path.join(os.tmpdir(), "test.txt");
    fs.writeFileSync(tmpFile, "not a csv");
    const fileInput = page.locator("input[type='file']");
    await fileInput.setInputFiles(tmpFile);
    await expect(page.getByText(/Please upload a .csv, .xlsx, or .xls file/)).toBeVisible();
    fs.unlinkSync(tmpFile);
  });

  test("uploading valid CSV shows preview table", async ({ page }) => {
    await page.getByText("Bulk Upload").click();
    const tmpFile = path.join(os.tmpdir(), "graduates.csv");
    fs.writeFileSync(tmpFile, "full_name,email\nJane Wanjiru,jane@example.com\nBrian Mutua,brian@example.com\n");
    const fileInput = page.locator("input[type='file']");
    await fileInput.setInputFiles(tmpFile);
    await expect(page.getByText(/Preview — 2 rows/)).toBeVisible();
    fs.unlinkSync(tmpFile);
  });

  test("Clear button removes preview", async ({ page }) => {
    await page.getByText("Bulk Upload").click();
    const tmpFile = path.join(os.tmpdir(), "graduates.csv");
    fs.writeFileSync(tmpFile, "full_name,email\nJane Wanjiru,jane@example.com\n");
    await page.locator("input[type='file']").setInputFiles(tmpFile);
    await expect(page.getByText(/Preview/)).toBeVisible();
    await page.getByRole("button", { name: /✕ Clear/ }).click();
    await expect(page.getByText(/Preview/)).not.toBeVisible();
    fs.unlinkSync(tmpFile);
  });

  test("successful bulk upload shows inserted count", async ({ page }) => {
    await page.getByText("Bulk Upload").click();
    const tmpFile = path.join(os.tmpdir(), "graduates.csv");
    fs.writeFileSync(tmpFile, "full_name,email\nJane Wanjiru,jane@example.com\nBrian Mutua,brian@example.com\n");
    await page.locator("input[type='file']").setInputFiles(tmpFile);
    await page.getByRole("button", { name: /Upload/ }).click();
    await expect(page.getByText(/records inserted successfully/)).toBeVisible();
    fs.unlinkSync(tmpFile);
  });

  test("Upload Another File button resets state", async ({ page }) => {
    await page.getByText("Bulk Upload").click();
    const tmpFile = path.join(os.tmpdir(), "graduates.csv");
    fs.writeFileSync(tmpFile, "full_name,email\nJane Wanjiru,jane@example.com\n");
    await page.locator("input[type='file']").setInputFiles(tmpFile);
    await page.getByRole("button", { name: /Upload/ }).click();
    await page.getByRole("button", { name: /Upload Another File/ }).click();
    await expect(page.getByText("Drop file here or click to browse")).toBeVisible();
    fs.unlinkSync(tmpFile);
  });
});

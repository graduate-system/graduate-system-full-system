import { test, expect } from "@playwright/test";
import { loginAndGo } from "../helpers/auth";

test.describe("Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGo(page, "/dashboard/settings");
  });

  // ── Navigation ───────────────────────────────────────────────────────────────

  test("5 section nav items render", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Security/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Registration/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Data Management/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Appearance/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /About/ })).toBeVisible();
  });

  test("clicking Registration shows registration content", async ({ page }) => {
    await page.getByRole("button", { name: /Registration/ }).click();
    await expect(page.getByText("Registration Link")).toBeVisible();
  });

  test("clicking Data Management shows data content", async ({ page }) => {
    await page.getByRole("button", { name: /Data Management/ }).click();
    await expect(page.getByText("Database Overview")).toBeVisible();
  });

  test("clicking Appearance shows theme content", async ({ page }) => {
    await page.getByRole("button", { name: /Appearance/ }).click();
    await expect(page.getByText("Theme")).toBeVisible();
  });

  test("clicking About shows about content", async ({ page }) => {
    await page.getByRole("button", { name: /About/ }).click();
    await expect(page.getByText("GradTrack Analytics")).toBeVisible();
  });

  // ── Security section ─────────────────────────────────────────────────────────

  test("Change PIN form renders 3 password inputs", async ({ page }) => {
    const inputs = page.locator("input[type='password']");
    await expect(inputs).toHaveCount(3);
  });

  test("new PIN mismatch shows error", async ({ page }) => {
    await page.locator("input[name='current_pin']").fill("testpin");
    await page.locator("input[name='new_pin']").fill("newpin1");
    await page.locator("input[name='confirm_pin']").fill("newpin2");
    await page.getByRole("button", { name: /Update PIN/ }).click();
    await expect(page.getByText("New PIN and confirmation do not match")).toBeVisible();
  });

  test("successful PIN change shows success message", async ({ page }) => {
    await page.locator("input[name='current_pin']").fill("testpin");
    await page.locator("input[name='new_pin']").fill("newpin99");
    await page.locator("input[name='confirm_pin']").fill("newpin99");
    await page.getByRole("button", { name: /Update PIN/ }).click();
    await expect(page.getByText(/PIN changed successfully/)).toBeVisible();
  });

  test("active session badge shows 8-hour expiry", async ({ page }) => {
    await expect(page.getByText("8-hour expiry")).toBeVisible();
  });

  test("End Session button shows confirmation", async ({ page }) => {
    await page.getByRole("button", { name: /End Session/ }).click();
    await expect(page.getByText("Are you sure?")).toBeVisible();
  });

  test("cancelling logout hides confirmation", async ({ page }) => {
    await page.getByRole("button", { name: /End Session/ }).click();
    await page.getByRole("button", { name: /Cancel/ }).click();
    await expect(page.getByText("Are you sure?")).not.toBeVisible();
  });

  test("confirming logout redirects to dashboard PIN gate", async ({ page }) => {
    await page.getByRole("button", { name: /End Session/ }).click();
    await page.getByRole("button", { name: /Yes, Logout/ }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  // ── Registration section ─────────────────────────────────────────────────────

  test("registration URL input shows /register path", async ({ page }) => {
    await page.getByRole("button", { name: /Registration/ }).click();
    const input = page.locator("input[readonly]");
    await expect(input).toHaveValue(/\/register/);
  });

  test("Copy button changes to Copied after click", async ({ page }) => {
    await page.getByRole("button", { name: /Registration/ }).click();
    await page.getByRole("button", { name: /Copy/ }).click();
    await expect(page.getByText("✅ Copied!")).toBeVisible();
  });

  test("QR code image renders", async ({ page }) => {
    await page.getByRole("button", { name: /Registration/ }).click();
    await expect(page.locator("img[alt='Registration QR Code']")).toBeVisible();
  });

  // ── Data Management section ──────────────────────────────────────────────────

  test("database stats cards render", async ({ page }) => {
    await page.getByRole("button", { name: /Data Management/ }).click();
    await expect(page.getByText("Total Records")).toBeVisible();
    await expect(page.getByText("Schools Represented")).toBeVisible();
    await expect(page.getByText("Programmes")).toBeVisible();
  });

  test("Purge All Data button is present", async ({ page }) => {
    await page.getByRole("button", { name: /Data Management/ }).click();
    await expect(page.getByRole("button", { name: /Purge All Data/ })).toBeVisible();
  });

  test("clicking Purge shows first confirmation step", async ({ page }) => {
    await page.getByRole("button", { name: /Data Management/ }).click();
    await page.getByRole("button", { name: /Purge All Data/ }).click();
    await expect(page.getByText("Are you absolutely sure?")).toBeVisible();
  });

  test("cancelling at first step returns to idle", async ({ page }) => {
    await page.getByRole("button", { name: /Data Management/ }).click();
    await page.getByRole("button", { name: /Purge All Data/ }).click();
    await page.getByRole("button", { name: /Cancel/ }).click();
    await expect(page.getByRole("button", { name: /Purge All Data/ })).toBeVisible();
  });

  test("confirming first step shows DELETE ALL typing step", async ({ page }) => {
    await page.getByRole("button", { name: /Data Management/ }).click();
    await page.getByRole("button", { name: /Purge All Data/ }).click();
    await page.getByRole("button", { name: /Yes, I understand/ }).click();
    await expect(page.getByPlaceholder("Type DELETE ALL")).toBeVisible();
  });

  test("Confirm Purge button disabled until DELETE ALL typed", async ({ page }) => {
    await page.getByRole("button", { name: /Data Management/ }).click();
    await page.getByRole("button", { name: /Purge All Data/ }).click();
    await page.getByRole("button", { name: /Yes, I understand/ }).click();
    await page.getByPlaceholder("Type DELETE ALL").fill("DELETE");
    await expect(page.getByRole("button", { name: /Confirm Purge/ })).toBeDisabled();
  });

  test("Confirm Purge button enabled when DELETE ALL typed exactly", async ({ page }) => {
    await page.getByRole("button", { name: /Data Management/ }).click();
    await page.getByRole("button", { name: /Purge All Data/ }).click();
    await page.getByRole("button", { name: /Yes, I understand/ }).click();
    await page.getByPlaceholder("Type DELETE ALL").fill("DELETE ALL");
    await expect(page.getByRole("button", { name: /Confirm Purge/ })).toBeEnabled();
  });

  test("successful purge shows success message", async ({ page }) => {
    await page.getByRole("button", { name: /Data Management/ }).click();
    await page.getByRole("button", { name: /Purge All Data/ }).click();
    await page.getByRole("button", { name: /Yes, I understand/ }).click();
    await page.getByPlaceholder("Type DELETE ALL").fill("DELETE ALL");
    await page.getByRole("button", { name: /Confirm Purge/ }).click();
    await expect(page.getByText(/Successfully deleted/)).toBeVisible();
  });

  // ── Appearance section ───────────────────────────────────────────────────────

  test("3 theme buttons render", async ({ page }) => {
    await page.getByRole("button", { name: /Appearance/ }).click();
    await expect(page.getByRole("button", { name: /Light/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Dark/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /System/ })).toBeVisible();
  });

  test("clicking Dark theme applies dark class", async ({ page }) => {
    await page.getByRole("button", { name: /Appearance/ }).click();
    await page.getByRole("button", { name: /^Dark$/ }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("clicking Light theme removes dark class", async ({ page }) => {
    await page.getByRole("button", { name: /Appearance/ }).click();
    await page.getByRole("button", { name: /^Dark$/ }).click();
    await page.getByRole("button", { name: /^Light$/ }).click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });
});

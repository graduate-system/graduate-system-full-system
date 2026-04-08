import { test, expect } from "@playwright/test";
import { setupUnauthenticated, loginAndGo } from "./helpers/auth";

test.describe("PIN Gate", () => {
  test("PIN gate renders when unauthenticated", async ({ page }) => {
    await setupUnauthenticated(page);
    await expect(page.getByText("Committee Dashboard")).toBeVisible();
    await expect(page.getByPlaceholder("Enter PIN")).toBeVisible();
  });

  test("MUST logo is displayed", async ({ page }) => {
    await setupUnauthenticated(page);
    await expect(page.locator("text=MUST").first()).toBeVisible();
  });

  test("Access Dashboard button disabled when PIN empty", async ({ page }) => {
    await setupUnauthenticated(page);
    await expect(page.getByRole("button", { name: /Access Dashboard/ })).toBeDisabled();
  });

  test("Access Dashboard button disabled when PIN less than 4 chars", async ({ page }) => {
    await setupUnauthenticated(page);
    await page.getByPlaceholder("Enter PIN").fill("123");
    await expect(page.getByRole("button", { name: /Access Dashboard/ })).toBeDisabled();
  });

  test("Access Dashboard button enabled when PIN 4+ chars", async ({ page }) => {
    await setupUnauthenticated(page);
    await page.getByPlaceholder("Enter PIN").fill("1234");
    await expect(page.getByRole("button", { name: /Access Dashboard/ })).toBeEnabled();
  });

  test("wrong PIN shows error message", async ({ page }) => {
    await setupUnauthenticated(page);
    await page.getByPlaceholder("Enter PIN").fill("wrongpin");
    await page.getByRole("button", { name: /Access Dashboard/ }).click();
    await expect(page.getByText("Incorrect PIN. Please try again.")).toBeVisible();
  });

  test("PIN input cleared after wrong PIN", async ({ page }) => {
    await setupUnauthenticated(page);
    await page.getByPlaceholder("Enter PIN").fill("wrongpin");
    await page.getByRole("button", { name: /Access Dashboard/ }).click();
    await expect(page.getByText("Incorrect PIN. Please try again.")).toBeVisible();
    await expect(page.getByPlaceholder("Enter PIN")).toHaveValue("");
  });

  test("correct PIN redirects to dashboard", async ({ page }) => {
    await setupUnauthenticated(page);
    await page.getByPlaceholder("Enter PIN").fill("testpin");
    await page.getByRole("button", { name: /Access Dashboard/ }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("Go Back button navigates back", async ({ page }) => {
    await page.goto("/");
    await setupUnauthenticated(page);
    await page.getByRole("button", { name: /Go Back/ }).click();
    await expect(page).toHaveURL("/");
  });

  test("Graduate Registration button navigates to /register", async ({ page }) => {
    await setupUnauthenticated(page);
    await page.getByRole("button", { name: /Graduate Registration/ }).click();
    await expect(page).toHaveURL(/\/register/);
  });

  test("Not a committee member text is visible", async ({ page }) => {
    await setupUnauthenticated(page);
    await expect(page.getByText("Not a committee member?")).toBeVisible();
  });

  test("PIN input is type password", async ({ page }) => {
    await setupUnauthenticated(page);
    await expect(page.getByPlaceholder("Enter PIN")).toHaveAttribute("type", "password");
  });

  test("Contact ICT hint is visible", async ({ page }) => {
    await setupUnauthenticated(page);
    await expect(page.getByText(/Contact the ICT department/)).toBeVisible();
  });
});

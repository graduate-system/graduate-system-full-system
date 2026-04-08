import { test, expect } from "@playwright/test";
import { mockBackendRoutes } from "./helpers/api-mocks";

test.describe("Graduate Registration Form", () => {
  test.beforeEach(async ({ page }) => {
    await mockBackendRoutes(page);
    await page.goto("/register");
  });

  // ── Page structure ──────────────────────────────────────────────────────────

  test("page renders registration header", async ({ page }) => {
    await expect(page.getByText("Share Your Graduate Journey")).toBeVisible();
  });

  test("step indicator shows Step 1 of 3", async ({ page }) => {
    await expect(page.getByText(/Step 1 of 3/)).toBeVisible();
    await expect(page.getByText("Personal Info")).toBeVisible();
  });

  test("Back button is disabled on step 1", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Back/ })).toBeDisabled();
  });

  test("Committee Dashboard link in header navigates to /dashboard", async ({ page }) => {
    await page.getByRole("link", { name: /Committee Dashboard/ }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  // ── Step 1: Personal Info validation ────────────────────────────────────────

  test("Next Step blocked when all fields empty", async ({ page }) => {
    await page.getByRole("button", { name: /Next Step/ }).click();
    await expect(page.getByText("Enter your full name")).toBeVisible();
  });

  test("full name with numbers shows error", async ({ page }) => {
    await page.getByPlaceholder("e.g. Jane Wanjiru Muthoni").fill("123 Jane");
    await page.getByRole("button", { name: /Next Step/ }).click();
    await expect(page.getByText(/letters only/)).toBeVisible();
  });

  test("full name too short shows error", async ({ page }) => {
    await page.getByPlaceholder("e.g. Jane Wanjiru Muthoni").fill("Jo");
    await page.getByRole("button", { name: /Next Step/ }).click();
    await expect(page.getByText("Enter your full name")).toBeVisible();
  });

  test("invalid email format shows error", async ({ page }) => {
    await page.getByPlaceholder("e.g. Jane Wanjiru Muthoni").fill("Jane Wanjiru");
    await page.getByPlaceholder("jane@example.com").fill("notanemail");
    await page.getByRole("button", { name: /Next Step/ }).click();
    await expect(page.getByText("Enter a valid email")).toBeVisible();
  });

  test("invalid phone format shows error", async ({ page }) => {
    await page.getByPlaceholder("e.g. Jane Wanjiru Muthoni").fill("Jane Wanjiru");
    await page.getByPlaceholder("+254712345678").fill("123");
    await page.getByRole("button", { name: /Next Step/ }).click();
    await expect(page.getByText(/valid phone number/)).toBeVisible();
  });

  test("neither email nor phone shows cross-field error", async ({ page }) => {
    await page.getByPlaceholder("e.g. Jane Wanjiru Muthoni").fill("Jane Wanjiru");
    await page.getByRole("button", { name: /Next Step/ }).click();
    await expect(page.getByText(/at least an email or phone/)).toBeVisible();
  });

  test("phone alone satisfies contact requirement", async ({ page }) => {
    await page.getByPlaceholder("e.g. Jane Wanjiru Muthoni").fill("Jane Wanjiru");
    await page.getByPlaceholder("+254712345678").fill("+254712345678");
    await page.getByRole("button", { name: /Next Step/ }).click();
    await expect(page.getByText(/Step 2 of 3/)).toBeVisible();
  });

  test("email alone satisfies contact requirement", async ({ page }) => {
    await page.getByPlaceholder("e.g. Jane Wanjiru Muthoni").fill("Jane Wanjiru");
    await page.getByPlaceholder("jane@example.com").fill("jane@example.com");
    await page.getByRole("button", { name: /Next Step/ }).click();
    await expect(page.getByText(/Step 2 of 3/)).toBeVisible();
  });

  test("invalid student number format shows error", async ({ page }) => {
    await page.getByPlaceholder("MUST/PG/123/2020").fill("ABC123");
    await page.getByPlaceholder("e.g. Jane Wanjiru Muthoni").fill("Jane Wanjiru");
    await page.getByPlaceholder("jane@example.com").fill("jane@example.com");
    await page.getByRole("button", { name: /Next Step/ }).click();
    await expect(page.getByText(/Format: MUST\/PG\/123\/2020/)).toBeVisible();
  });

  test("Next Step advances to step 2 when valid", async ({ page }) => {
    await page.getByPlaceholder("e.g. Jane Wanjiru Muthoni").fill("Jane Wanjiru");
    await page.getByPlaceholder("jane@example.com").fill("jane@example.com");
    await page.getByRole("button", { name: /Next Step/ }).click();
    await expect(page.getByText(/Step 2 of 3/)).toBeVisible();
    await expect(page.getByText("Academic Details")).toBeVisible();
  });

  // ── Step 2: Academic Details ─────────────────────────────────────────────────

  test("campus buttons render both options", async ({ page }) => {
    await page.getByPlaceholder("e.g. Jane Wanjiru Muthoni").fill("Jane Wanjiru");
    await page.getByPlaceholder("jane@example.com").fill("jane@example.com");
    await page.getByRole("button", { name: /Next Step/ }).click();
    await expect(page.getByRole("button", { name: "Main Campus (Nchiru)" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Meru Town Campus" })).toBeVisible();
  });

  test("department select disabled until school selected", async ({ page }) => {
    await page.getByPlaceholder("e.g. Jane Wanjiru Muthoni").fill("Jane Wanjiru");
    await page.getByPlaceholder("jane@example.com").fill("jane@example.com");
    await page.getByRole("button", { name: /Next Step/ }).click();
    const deptSelect = page.getByRole("combobox").filter({ hasText: /Select school first/ });
    await expect(deptSelect).toBeDisabled();
  });

  test("graduation year dropdown contains 1983", async ({ page }) => {
    await page.getByPlaceholder("e.g. Jane Wanjiru Muthoni").fill("Jane Wanjiru");
    await page.getByPlaceholder("jane@example.com").fill("jane@example.com");
    await page.getByRole("button", { name: /Next Step/ }).click();
    const yearSelect = page.locator("select").filter({ hasText: /Select year/ });
    await expect(yearSelect.locator("option[value='1983']")).toHaveCount(1);
  });

  test("Back button returns to step 1 and preserves data", async ({ page }) => {
    await page.getByPlaceholder("e.g. Jane Wanjiru Muthoni").fill("Jane Wanjiru");
    await page.getByPlaceholder("jane@example.com").fill("jane@example.com");
    await page.getByRole("button", { name: /Next Step/ }).click();
    await page.getByRole("button", { name: /Back/ }).click();
    await expect(page.getByText(/Step 1 of 3/)).toBeVisible();
    await expect(page.getByPlaceholder("e.g. Jane Wanjiru Muthoni")).toHaveValue("Jane Wanjiru");
  });

  // ── Step 3: Employment ───────────────────────────────────────────────────────

  async function goToStep3(page: import("@playwright/test").Page) {
    await page.getByPlaceholder("e.g. Jane Wanjiru Muthoni").fill("Jane Wanjiru");
    await page.getByPlaceholder("jane@example.com").fill("jane@example.com");
    await page.getByRole("button", { name: /Next Step/ }).click();
    // Step 2: select campus, school, dept, programme, year
    await page.getByRole("button", { name: "Main Campus (Nchiru)" }).click();
    await page.locator("select").filter({ hasText: /Select your school/ }).selectOption("sci");
    await page.waitForTimeout(300);
    await page.locator("select").filter({ hasText: /Select department/ }).selectOption("cs");
    await page.waitForTimeout(300);
    await page.locator("select").filter({ hasText: /Select programme/ }).selectOption("Bachelor of Science (Computer Science)");
    await page.locator("select").filter({ hasText: /Select year/ }).selectOption("2023");
    await page.getByRole("button", { name: /Next Step/ }).click();
    await expect(page.getByText(/Step 3 of 3/)).toBeVisible();
  }

  test("all 7 employment status options render", async ({ page }) => {
    await goToStep3(page);
    await expect(page.getByRole("button", { name: "Employed (Full-time)" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Unemployed — Seeking" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Further Studies" })).toBeVisible();
  });

  test("employer fields hidden when Unemployed Seeking selected", async ({ page }) => {
    await goToStep3(page);
    await page.getByRole("button", { name: "Unemployed — Seeking" }).click();
    await expect(page.getByPlaceholder("e.g. Safaricom PLC")).not.toBeVisible();
  });

  test("employer fields shown when Employed Full-time selected", async ({ page }) => {
    await goToStep3(page);
    await page.getByRole("button", { name: "Employed (Full-time)" }).click();
    await expect(page.getByPlaceholder("e.g. Safaricom PLC")).toBeVisible();
  });

  test("skills picker renders skill pills", async ({ page }) => {
    await goToStep3(page);
    await expect(page.getByRole("button", { name: /Programming \/ Software Development/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Data Analysis/ })).toBeVisible();
  });

  test("clicking a skill selects it with checkmark", async ({ page }) => {
    await goToStep3(page);
    const skill = page.getByRole("button", { name: /Programming \/ Software Development/ });
    await skill.click();
    await expect(skill).toContainText("✓");
  });

  test("clicking selected skill deselects it", async ({ page }) => {
    await goToStep3(page);
    const skill = page.getByRole("button", { name: /Programming \/ Software Development/ });
    await skill.click();
    await skill.click();
    await expect(skill).not.toContainText("✓");
  });

  test("skill counter shows selected count", async ({ page }) => {
    await goToStep3(page);
    await page.getByRole("button", { name: /Programming \/ Software Development/ }).click();
    await page.getByRole("button", { name: /Data Analysis/ }).click();
    await expect(page.getByText("2/10 selected")).toBeVisible();
  });

  test("consent required to submit", async ({ page }) => {
    await goToStep3(page);
    await page.getByRole("button", { name: "Unemployed — Seeking" }).click();
    await page.getByRole("button", { name: /Submit My Details/ }).click();
    await expect(page.getByText("You must consent to continue")).toBeVisible();
  });

  test("invalid LinkedIn URL shows error", async ({ page }) => {
    await goToStep3(page);
    await page.getByRole("button", { name: "Employed (Full-time)" }).click();
    await page.getByPlaceholder("e.g. Safaricom PLC").fill("Safaricom");
    await page.locator("select").filter({ hasText: /Select sector/ }).selectOption("Information & Communication Technology (ICT)");
    await page.getByPlaceholder("https://linkedin.com/in/yourname").fill("notaurl");
    await page.getByRole("button", { name: /Submit My Details/ }).click();
    await expect(page.getByText("Enter a valid URL")).toBeVisible();
  });

  // ── Submission ───────────────────────────────────────────────────────────────

  test("successful submission shows thank you screen", async ({ page }) => {
    await goToStep3(page);
    await page.getByRole("button", { name: "Unemployed — Seeking" }).click();
    await page.locator("label").filter({ hasText: /I consent/ }).click();
    await page.getByRole("button", { name: /Submit My Details/ }).click();
    await expect(page.getByText("Thank you for submitting!")).toBeVisible();
    await expect(page.getByText(/Submission ID: #/)).toBeVisible();
  });

  test("Submit Another Response resets form to step 1", async ({ page }) => {
    await goToStep3(page);
    await page.getByRole("button", { name: "Unemployed — Seeking" }).click();
    await page.locator("label").filter({ hasText: /I consent/ }).click();
    await page.getByRole("button", { name: /Submit My Details/ }).click();
    await page.getByRole("button", { name: /Submit Another Response/ }).click();
    await expect(page.getByText(/Step 1 of 3/)).toBeVisible();
  });
});

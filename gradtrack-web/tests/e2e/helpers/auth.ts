import type { Page } from "@playwright/test";
import { mockBackendRoutes, mockCommitteeAuth } from "./api-mocks";

/**
 * Sets up all backend mocks and navigates to an authenticated dashboard page.
 * Uses route interception so no real backend is needed.
 */
export async function loginAndGo(page: Page, path = "/dashboard") {
  await mockCommitteeAuth(page, true);
  await mockBackendRoutes(page);
  await page.goto(path);
}

/**
 * Sets up mocks for an unauthenticated state (shows PIN gate on /dashboard).
 */
export async function setupUnauthenticated(page: Page) {
  await mockCommitteeAuth(page, false);
  await mockBackendRoutes(page);
  await page.goto("/dashboard");
}

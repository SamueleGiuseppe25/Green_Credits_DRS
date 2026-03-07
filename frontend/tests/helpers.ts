import { Page } from '@playwright/test'

/**
 * Shared test helpers for GreenCredits E2E tests.
 *
 * Credentials are injected via environment variables so they are never
 * hardcoded in source.  In CI these come from GitHub Secrets; locally
 * you can export them in your shell or add them to a .env.test file.
 */

export const BASE_URL = process.env.BASE_URL ?? 'https://green-credits-drs.vercel.app'

export const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? ''
export const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? ''
export const USER_EMAIL = process.env.TEST_USER_EMAIL ?? ''
export const USER_PASSWORD = process.env.TEST_USER_PASSWORD ?? ''

// A driver account must also exist in the production DB.
// Re-use the admin credentials or define separate DRIVER secrets if needed.
export const DRIVER_EMAIL = process.env.TEST_DRIVER_EMAIL ?? ADMIN_EMAIL
export const DRIVER_PASSWORD = process.env.TEST_DRIVER_PASSWORD ?? ADMIN_PASSWORD

/**
 * Fill the login form and wait for the redirect away from /login.
 */
export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  // Labels have no `for` attribute in the app, so getByLabel doesn't work.
  // Use the input type as the selector instead.
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  // Wait until we leave /login (redirect to /wallet, /admin, /driver, etc.)
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 20_000 })
}

/**
 * Click the Logout button in the app header.
 */
export async function logout(page: Page) {
  await page.getByRole('button', { name: /logout/i }).click()
  await page.waitForURL('/login', { timeout: 10_000 })
}

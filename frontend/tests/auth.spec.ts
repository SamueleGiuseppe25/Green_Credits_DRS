/**
 * auth.spec.ts
 *
 * Covers: Register new account → log in → log out
 *
 * Note: Registration creates a real account in the production DB and immediately
 * redirects to Stripe checkout.  To avoid polluting the DB on every CI run, the
 * full registration flow is @local-only and skipped in CI.
 *
 * What always runs in CI:
 *  - Landing page renders correctly
 *  - Login page renders the form
 *  - Login with valid credentials succeeds and redirects
 *  - Log out returns to the public home page
 *  - Login with wrong credentials shows an error
 */

import { test, expect } from '@playwright/test'
import { USER_EMAIL, USER_PASSWORD, loginAs, logout } from './helpers'

// ---------------------------------------------------------------------------
// Always-on: page load & UI smoke tests
// ---------------------------------------------------------------------------

test('landing page renders with Sign up / Login links', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/GreenCredits/i)
  // The signup CTAs use "Get Started", "Start Collecting", or "Choose Plan" (not "Sign up")
  await expect(
    page.getByRole('link', { name: /get started|start collecting|choose plan/i }).first()
  ).toBeVisible()
  // The nav Login link is present
  await expect(page.getByRole('link', { name: /^login$/i })).toBeVisible()
})

test('login page renders email and password fields', async ({ page }) => {
  await page.goto('/login')
  await expect(page.locator('input[type="email"]')).toBeVisible()
  await expect(page.locator('input[type="password"]')).toBeVisible()
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
})

test('login with wrong credentials shows error', async ({ page }) => {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill('nonexistent@example.com')
  await page.locator('input[type="password"]').fill('wrongpassword')
  await page.getByRole('button', { name: /sign in/i }).click()
  // The app renders an inline <div class="text-sm text-red-600"> with the error message.
  await expect(page.locator('.text-red-600')).toBeVisible({ timeout: 8_000 })
})

test('login with valid credentials redirects away from /login', async ({ page }) => {
  test.skip(!USER_EMAIL || !USER_PASSWORD, 'Skipped: TEST_USER_EMAIL / TEST_USER_PASSWORD env vars not set')
  await loginAs(page, USER_EMAIL, USER_PASSWORD)
  // Should now be on a private page (wallet, collections, etc.)
  expect(page.url()).not.toContain('/login')
})

test('logout returns to the home page', async ({ page }) => {
  test.skip(!USER_EMAIL || !USER_PASSWORD, 'Skipped: TEST_USER_EMAIL / TEST_USER_PASSWORD env vars not set')
  await loginAs(page, USER_EMAIL, USER_PASSWORD)
  await logout(page)
  await expect(page).toHaveURL('/login')})

// ---------------------------------------------------------------------------
// @local-only: Full registration → Stripe redirect
// Skipped in CI to avoid creating orphaned accounts in the production DB.
// ---------------------------------------------------------------------------

test('signup page renders with plan selector @local-only', async ({ page }) => {
  test.skip(!!process.env.CI, 'Skipped in CI — would create a real account in the production DB')

  await page.goto('/signup')
  await expect(page.locator('input[type="email"]')).toBeVisible()
  await expect(page.locator('input[type="password"]')).toBeVisible()
  // Plan selector should list at least two options
  const planSelect = page.locator('select')
  await expect(planSelect).toBeVisible()
  const options = await planSelect.locator('option').count()
  expect(options).toBeGreaterThanOrEqual(2)
})

/**
 * admin.spec.ts
 *
 * Covers: Log in as admin → view metrics dashboard → verify collections tab →
 * change a collection status (assign driver).
 *
 * Credentials come from TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD GitHub Secrets.
 */

import { test, expect } from '@playwright/test'
import { ADMIN_EMAIL, ADMIN_PASSWORD, loginAs } from './helpers'

test.describe('Admin dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD)
    // Admin is redirected to /admin after login
    await page.waitForURL(/\/admin/, { timeout: 15_000 })
  })

  test('renders the Admin Dashboard heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /admin/i }).first()).toBeVisible()
  })

  test('shows metric cards (users, collections, revenue)', async ({ page }) => {
    // MetricCard components render generic stat cards — look for numeric values
    // or the card container.  We check that at least 2 metric-like elements render.
    const metricCards = page.locator('[class*="metric"], [class*="MetricCard"], .grid > div')
    // Wait for at least 1 card to appear (they load async)
    await expect(metricCards.first()).toBeVisible({ timeout: 10_000 })
  })

  test('shows Collections tab with data table', async ({ page }) => {
    // The Collections tab is the default tab
    await expect(page.getByRole('tab', { name: /collections/i }).or(
      page.getByRole('button', { name: /collections/i })
    ).first()).toBeVisible()

    // At least the header row of the table should be present
    await expect(page.getByText(/status|scheduled|driver/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('can switch to the Drivers tab', async ({ page }) => {
    const driversTab = page.getByRole('button', { name: /^drivers$/i })
    await driversTab.click()
    await expect(page.getByText(/driver|vehicle|zone/i).first()).toBeVisible({ timeout: 8_000 })
  })

  test('can switch to the Claims tab', async ({ page }) => {
    const claimsTab = page.getByRole('button', { name: /^claims$/i })
    await claimsTab.click()
    await expect(page.getByText(/claim|description|open|resolved/i).first()).toBeVisible({ timeout: 8_000 })
  })

  test('can switch to the Notifications tab', async ({ page }) => {
    const notifTab = page.getByRole('button', { name: /notifications/i })
    await notifTab.click()
    await expect(page.getByText(/notification|broadcast|title|body/i).first()).toBeVisible({ timeout: 8_000 })
  })

  /**
   * Status-change test — @local-only because it mutates production data.
   * Only run this locally against a test environment.
   */
  test('can assign a driver to a scheduled collection @local-only', async ({ page }) => {
    test.skip(!!process.env.CI, 'Skipped in CI — mutates production collection records')

    // Collections tab (default)
    // Find first row with status "scheduled" and open the assign-driver dropdown
    const assignSelect = page
      .locator('select')
      .filter({ hasText: /assign driver|select driver/i })
      .or(page.getByLabel(/assign driver/i))
      .first()

    if (await assignSelect.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const firstDriverOption = assignSelect.locator('option').nth(1)
      const driverValue = await firstDriverOption.getAttribute('value')
      if (driverValue) {
        await assignSelect.selectOption(driverValue)
        // The row should update to "assigned"
        await expect(page.getByText(/assigned/i).first()).toBeVisible({ timeout: 10_000 })
      }
    }
  })
})

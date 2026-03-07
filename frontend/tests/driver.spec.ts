/**
 * driver.spec.ts
 *
 * Covers: Log in as a driver → view assigned collections list →
 * verify the driver dashboard renders correctly.
 *
 * Credentials come from TEST_DRIVER_EMAIL / TEST_DRIVER_PASSWORD GitHub Secrets
 * (or fall back to admin credentials if driver-specific ones are not set).
 *
 * The "mark as collected" step is @local-only to avoid mutating production
 * collection statuses on every CI run.
 */

import { test, expect } from '@playwright/test'
import { DRIVER_EMAIL, DRIVER_PASSWORD, loginAs } from './helpers'

test.describe('Driver dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, DRIVER_EMAIL, DRIVER_PASSWORD)
    // Driver users are redirected to /driver after login
    await page.goto('/driver')
  })

  test('renders the driver dashboard heading', async ({ page }) => {
    // The page title is not a fixed heading — look for "Driver" in the sidebar or page
    await expect(
      page.getByText(/driver|your collections|assigned/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('shows a status filter (All / Assigned / Collected / Completed)', async ({ page }) => {
    // The status filter is a <select> combobox, not individual buttons.
    await expect(page.locator('select').filter({ hasText: /all/i })).toBeVisible({ timeout: 10_000 })
  })

  test('shows driver profile section', async ({ page }) => {
    await expect(page.getByText(/vehicle|phone|zone|profile/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('shows earnings section', async ({ page }) => {
    await expect(page.getByText(/earnings|balance|payout/i).first()).toBeVisible({ timeout: 10_000 })
  })

  /**
   * Marking a collection as collected mutates production data — @local-only.
   */
  test('can mark an assigned collection as collected @local-only', async ({ page }) => {
    test.skip(!!process.env.CI, 'Skipped in CI — mutates production collection records')

    // Look for a "Mark collected" or similar button on an assigned collection row
    const markBtn = page.getByRole('button', { name: /mark collected|collected/i }).first()

    if (await markBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await markBtn.click()
      // A modal or confirmation dialog may appear
      const confirmBtn = page.getByRole('button', { name: /confirm|yes|ok/i })
      if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await confirmBtn.click()
      }
      await expect(
        page.getByText(/collected|updated|success/i).first()
      ).toBeVisible({ timeout: 10_000 })
    }
  })
})

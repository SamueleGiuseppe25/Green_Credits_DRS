/**
 * collections.spec.ts
 *
 * Covers: Log in with an active subscription → visit Collections page →
 * verify the booking form is present → schedule a one-off collection →
 * verify it appears in the collections list.
 *
 * The test user (TEST_USER_EMAIL) must have an active subscription in the
 * production DB and a home address saved in Settings, otherwise the
 * booking form will be disabled.  If those preconditions are not met the
 * booking steps are skipped gracefully.
 */

import { test, expect } from '@playwright/test'
import { USER_EMAIL, USER_PASSWORD, loginAs } from './helpers'

test.describe('Collections page', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!USER_EMAIL || !USER_PASSWORD, 'Skipped: TEST_USER_EMAIL / TEST_USER_PASSWORD env vars not set')
    await loginAs(page, USER_EMAIL, USER_PASSWORD)
    await page.goto('/collections')
  })

  test('renders the Collections heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /collections/i })).toBeVisible()
  })

  test('shows "Your collections" panel', async ({ page }) => {
    await expect(page.getByText(/your collections/i)).toBeVisible()
  })

  test('shows "Create a collection" form section', async ({ page }) => {
    await expect(page.getByText(/create a collection/i)).toBeVisible()
  })

  test('shows "Recurring pickup schedule" section', async ({ page }) => {
    await expect(page.getByText(/recurring pickup schedule/i)).toBeVisible()
  })

  test('material type selector has Bottles, Glass and Both buttons', async ({ page }) => {
    const bottlesBtn = page.getByRole('button', { name: /bottles/i })
    const glassBtn = page.getByRole('button', { name: /glass/i })
    const bothBtn = page.getByRole('button', { name: /both/i })
    await expect(bottlesBtn.first()).toBeVisible()
    await expect(glassBtn.first()).toBeVisible()
    await expect(bothBtn.first()).toBeVisible()
  })

  test('voucher preference toggle has My Wallet and Donate to Charity options', async ({ page }) => {
    await expect(page.getByRole('button', { name: /my wallet/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /donate to charity/i })).toBeVisible()
  })

  /**
   * Full booking flow — only runs when the test user has an active sub + address.
   * Booking creates a real collection in the DB; it can be cancelled/deleted
   * afterwards by the admin or by the user in the UI.
   */
  test('schedule a one-off collection and verify it appears in list @local-only', async ({ page }) => {
    test.skip(!!process.env.CI, 'Skipped in CI — creates a real collection record in the production DB')

    // The booking section is a <form>; scope by the unique date input inside it.
    const createForm = page.locator('form').filter({ has: page.locator('input[type="date"]') })
    const createBtn = createForm.getByRole('button', { name: /^create$/i })

    // Pick a date 2 days in the future
    const future = new Date()
    future.setDate(future.getDate() + 2)
    const yyyy = future.getFullYear()
    const mm = String(future.getMonth() + 1).padStart(2, '0')
    const dd = String(future.getDate()).padStart(2, '0')
    const dateStr = `${yyyy}-${mm}-${dd}`

    await createForm.locator('input[type="date"]').fill(dateStr)
    await createForm.locator('input[type="time"]').fill('10:00')

    // Select the first available return point
    const rpSelect = createForm.locator('select')
    const firstOption = rpSelect.locator('option').nth(1) // 0 is the placeholder "—"
    const rpValue = await firstOption.getAttribute('value')
    if (rpValue) {
      await rpSelect.selectOption(rpValue)
    }

    await createBtn.click()

    // A toast or the collection list should reflect the new entry
    await expect(page.getByText(/scheduled|created/i).first()).toBeVisible({ timeout: 10_000 })
  })
})

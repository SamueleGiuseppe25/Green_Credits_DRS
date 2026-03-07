/**
 * claims.spec.ts
 *
 * Covers: Log in as a regular user → navigate to /claims →
 * verify the submission form renders → submit a claim →
 * verify it appears in the claims list.
 *
 * Submitting a claim creates a real record in the production DB.
 * The render/navigation checks always run in CI; the full submit test is
 * @local-only to avoid polluting the claims table on every pipeline run.
 */

import { test, expect } from '@playwright/test'
import { USER_EMAIL, USER_PASSWORD, loginAs } from './helpers'

test.describe('Claims page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USER_EMAIL, USER_PASSWORD)
    await page.goto('/claims')
  })

  test('renders the Claims heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /claims/i })).toBeVisible()
  })

  test('shows the claim submission form', async ({ page }) => {
    await expect(page.locator('textarea')).toBeVisible()
    await expect(page.getByRole('button', { name: /submit/i })).toBeVisible()
  })

  test('shows a Description textarea that is required', async ({ page }) => {
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible()
    await expect(textarea).toHaveAttribute('required')
  })

  test('shows an optional Image field', async ({ page }) => {
    // The image field accepts file input
    await expect(page.locator('input[type="file"][accept*="image"]')).toBeVisible()
  })

  test('shows explanatory text about what claims are for', async ({ page }) => {
    await expect(page.getByText(/missing|wallet|review/i).first()).toBeVisible()
  })

  /**
   * Full claim submission — @local-only to avoid creating test records in
   * the production claims table on every CI run.
   */
  test('submitting a claim inserts it into the claims list @local-only', async ({ page }) => {
    test.skip(!!process.env.CI, 'Skipped in CI — creates a real claim record in the production DB')

    const descriptionText = `Playwright automated test claim — ${new Date().toISOString()}`

    await page.locator('textarea').fill(descriptionText)
    await page.getByRole('button', { name: /submit/i }).click()

    // A success toast should appear
    await expect(page.getByText(/submitted|success/i).first()).toBeVisible({ timeout: 10_000 })

    // The claim should now appear in the list below the form
    await expect(page.getByText(descriptionText)).toBeVisible({ timeout: 10_000 })
  })

  test('submitting an empty description shows a validation error', async ({ page }) => {
    // Clear the description and try to submit
    const textarea = page.locator('textarea')
    await textarea.fill('')
    await page.getByRole('button', { name: /submit/i }).click()

    // Either browser validation (required) or a toast error should appear
    const isRequired = await textarea.evaluate((el) => (el as HTMLTextAreaElement).validity.valueMissing)
    if (!isRequired) {
      await expect(page.getByText(/description is required|required/i).first()).toBeVisible({ timeout: 5_000 })
    }
    // If browser handles it natively, the form just won't submit — that's also acceptable
  })
})

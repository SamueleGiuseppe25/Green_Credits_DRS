import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'

// Load .env.test when running locally.
// In CI the same variables come from GitHub Secrets and are already in process.env,
// so dotenv will not override them.
dotenv.config({ path: fileURLToPath(new URL('.env.test', import.meta.url)) })

/**
 * GreenCredits Playwright E2E configuration.
 *
 * In CI the tests run against the live Vercel deployment.
 * Locally you can set BASE_URL to target localhost.
 */
const BASE_URL = process.env.BASE_URL ?? 'https://green-credits-drs.vercel.app'

export default defineConfig({
  testDir: './tests',
  /* Each test file gets a fresh browser context */
  fullyParallel: true,
  /* Fail the build in CI if a test.only is left in source */
  forbidOnly: !!process.env.CI,
  /* No retries locally; 1 retry in CI for flakiness */
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: '../playwright-junit.xml' }],
    ['list'],
  ],
  use: {
    baseURL: BASE_URL,
    /* Capture on failure */
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
})

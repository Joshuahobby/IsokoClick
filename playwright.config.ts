import { defineConfig, devices } from '@playwright/test'

// Playwright is used for end-to-end and accessibility (axe-core) checks.
// The suite runs against a local Next dev server; in CI the same webServer
// block boots the app before tests and tears it down after.
const PORT = Number(process.env.PORT ?? 3000)
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  // One worker: the local Next dev server compiles routes lazily on first
  // hit, so parallel workers would trigger simultaneous cold compiles and
  // starve each other. Serial keeps each compile within the per-test budget.
  workers: 1,
  // Generous timeouts: the Next dev server compiles each route on first hit,
  // which can take well over a minute cold on a loaded machine. These only
  // bite on that first compile — a warm or production server serves instantly.
  timeout: 180_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: BASE_URL,
    navigationTimeout: 150_000,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // Reuse a dev server if one is already running locally; otherwise start one.
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})

import { defineConfig, devices } from '@playwright/test'

// Playwright is used for end-to-end and accessibility (axe-core) checks.
//
// The suite runs against a PRODUCTION build (`next build && next start`), not
// `next dev`. The dev server injects Next's own dev-tools overlay into the
// document, and axe-core traverses shadow DOM — so scanning dev means Next's
// dev UI can fail this project's gate, while dev-only styling can hide a real
// production regression. Production also removes the lazy per-route compile
// that previously forced multi-minute timeouts.
const rawPort = Number(process.env.PORT)
const PORT = Number.isFinite(rawPort) && rawPort > 0 ? rawPort : 3000

// When PLAYWRIGHT_BASE_URL is set the suite targets an already-deployed app
// (e.g. a Vercel preview). In that case we must NOT also boot a local server:
// Playwright would spawn a build nothing uses and leave it running for the
// duration of the run.
const EXTERNAL_BASE_URL = process.env.PLAYWRIGHT_BASE_URL
const BASE_URL = EXTERNAL_BASE_URL ?? `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  // One worker: the suite is small and shares a single server, so serial runs
  // keep axe scans from competing for CPU and keep failures reproducible.
  workers: 1,
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: BASE_URL,
    navigationTimeout: 30_000,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // Only manage a server when we own it. `timeout` covers a cold `next build`.
  webServer: EXTERNAL_BASE_URL
    ? undefined
    : {
        command: 'npm run build && npm run start',
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
      },
})

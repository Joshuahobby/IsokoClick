import { expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Shared by the public and authenticated a11y suites so the two can never
// drift on what counts as a blocking violation.

export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

// Only serious/critical impacts fail the build, so the gate stays actionable;
// moderate and minor best-practice findings still appear in the report.
const BLOCKING_IMPACTS = new Set(['serious', 'critical'])

export async function expectNoBlockingViolations(page: Page, context: string) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()

  const blocking = results.violations.filter(
    (v) => v.impact != null && BLOCKING_IMPACTS.has(v.impact)
  )

  // Compact, readable failure output: rule id, impact, and the nodes hit.
  const summary = blocking.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.map((n) => n.target.join(' ')),
  }))

  expect(summary, `Serious/critical a11y violations: ${context}`).toEqual([])
}

/**
 * Signs in through the real login form.
 *
 * The email and password inputs are React-controlled, so filling them before
 * hydration sets the DOM value but never the component state and the submit
 * posts empty credentials. Waiting for the button to be enabled and stable is
 * the hydration barrier.
 */
export async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login', { waitUntil: 'load' })

  const submit = page.getByRole('button', { name: /log in/i })
  await expect(submit).toBeEnabled()
  await page.waitForTimeout(500)

  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await expect(page.locator('#email')).toHaveValue(email)

  await submit.click()
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30_000 })
}

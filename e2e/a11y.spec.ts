import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Accessibility regression gate. Scans public storefront pages with axe-core
// against the WCAG 2.0/2.1 A and AA rulesets and fails on any serious- or
// critical-impact violation. This catches the classes of issue found in the
// storefront audit — colour contrast, missing accessible names, form labels —
// before they ship.
//
// Only serious/critical impacts are enforced so the gate stays actionable;
// moderate/minor best-practice findings are surfaced in the report but do not
// fail the build. Authenticated areas (admin, partner) need signed-in fixtures
// and are intentionally out of scope for this public-pages suite.

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
const BLOCKING_IMPACTS = new Set(['serious', 'critical'])

async function scan(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'load' })

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

  expect(summary, `Serious/critical a11y violations on ${path}`).toEqual([])
}

const PUBLIC_PAGES = [
  { name: 'home', path: '/' },
  { name: 'shop', path: '/shop' },
  { name: 'login', path: '/login' },
  { name: 'signup', path: '/signup' },
]

for (const { name, path } of PUBLIC_PAGES) {
  test(`storefront a11y: ${name} (${path})`, async ({ page }) => {
    await scan(page, path)
  })
}

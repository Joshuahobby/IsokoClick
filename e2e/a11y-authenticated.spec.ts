import { test } from '@playwright/test'
import { expectNoBlockingViolations, signIn } from './support/axe'

// Accessibility gate for the signed-in portals.
//
// e2e/a11y.spec.ts scans as a guest, which structurally cannot reach anything
// behind a login — and some markup only exists there. The header's account
// menu is the worked example: signed out it renders a "Sign in" link with
// visible text and passes, signed in it renders an icon-only trigger that axe
// reports as a critical `button-name` violation. No amount of extra public
// pages would have found it.
//
// Credentials come from the environment because a password is a real secret,
// unlike the NEXT_PUBLIC_ Supabase pair the public suite needs. Without them
// these tests skip rather than fail, so a fork or an unconfigured checkout
// still gets a green run — but see .github/workflows/ci.yml, which emits a
// warning so a skipped gate is never silently mistaken for a passing one.

type Portal = {
  name: string
  email: string | undefined
  password: string | undefined
  paths: string[]
}

const PORTALS: Portal[] = [
  {
    name: 'admin',
    email: process.env.E2E_ADMIN_EMAIL,
    password: process.env.E2E_ADMIN_PASSWORD,
    paths: [
      '/admin/dashboard',
      '/admin/products',
      '/admin/products/new',
      '/admin/orders',
      '/admin/partners',
      '/admin/analytics',
    ],
  },
  {
    name: 'partner',
    email: process.env.E2E_PARTNER_EMAIL,
    password: process.env.E2E_PARTNER_PASSWORD,
    paths: [
      '/partner/dashboard',
      '/partner/catalog',
      '/partner/catalog/new',
      '/partner/orders',
      '/partner/payouts',
    ],
  },
]

for (const portal of PORTALS) {
  const credentials = portal.email && portal.password

  test.describe(`${portal.name} portal a11y`, () => {
    test.skip(
      !credentials,
      `Set E2E_${portal.name.toUpperCase()}_EMAIL and E2E_${portal.name.toUpperCase()}_PASSWORD to run`
    )

    // One sign-in per page keeps each test independent; the suite is small and
    // already runs single-worker, so the extra logins cost little.
    for (const path of portal.paths) {
      test(`${portal.name} a11y: ${path}`, async ({ page }) => {
        await signIn(page, portal.email!, portal.password!)
        await page.goto(path, { waitUntil: 'load' })
        await expectNoBlockingViolations(page, `${portal.name} ${path}`)
      })
    }

    // The account menu only exists in the signed-in tree, and its contents are
    // rendered on open — so an unopened scan would miss the menu items too.
    test(`${portal.name}: header account menu has a name and opens cleanly`, async ({ page }) => {
      await signIn(page, portal.email!, portal.password!)
      await page.goto('/', { waitUntil: 'load' })

      const trigger = page.getByRole('button', { name: /my account/i })
      await trigger.click()
      await expectNoBlockingViolations(page, `${portal.name} account menu open`)
    })
  })
}

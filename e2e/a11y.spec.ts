import { test, expect, type Page } from '@playwright/test'
import { expectNoBlockingViolations } from './support/axe'

// Accessibility regression gate. Scans public storefront pages with axe-core
// against the WCAG 2.0/2.1 A and AA rulesets and fails on any serious- or
// critical-impact violation. This catches the classes of issue found in the
// storefront audit — colour contrast, missing accessible names, form labels —
// before they ship.
//
// Signed-in areas (admin, partner) are covered by e2e/a11y-authenticated.spec.ts,
// which needs credentials this suite deliberately does not. Keep public pages
// here so the gate still runs everywhere without secrets.
//
// Known blind spot: axe does not evaluate `::placeholder` colour, so form
// placeholder contrast is NOT covered here and must be reviewed by hand.

// A cart item shaped like CartItem in src/hooks/use-cart.ts, written straight
// into the zustand persist key so cart states are deterministic and do not
// depend on what happens to be in the database.
function seedCart(page: Page, count: number, qty = 1) {
  const items = Array.from({ length: count }, (_, i) => ({
    id: `seed-${i + 1}`,
    slug: `seed-product-${i + 1}`,
    name: `Seed Product ${i + 1}`,
    price: 10_000,
    qty,
    minQty: 1,
    unitType: 'piece',
    imageUrl: null,
    source: 'internal',
  }))

  return page.addInitScript(
    (payload) => window.localStorage.setItem('isokoclick-cart', payload),
    JSON.stringify({ state: { items }, version: 0 })
  )
}

// ── Static page scans ────────────────────────────────────────────────────

const PUBLIC_PAGES = [
  { name: 'home', path: '/' },
  { name: 'shop', path: '/shop' },
  { name: 'login', path: '/login' },
  { name: 'signup', path: '/signup' },
  { name: 'reset password', path: '/reset-password' },
  { name: 'partner register', path: '/partner/register' },
]

for (const { name, path } of PUBLIC_PAGES) {
  test(`storefront a11y: ${name} (${path})`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'load' })
    await expectNoBlockingViolations(page, path)
  })
}

// A product detail page reached the way a shopper reaches one, rather than by
// a hardcoded slug, so the scan does not break when seed data changes. This
// covers the PDP gallery and its no-image fallback, neither of which any
// static path above renders.
test('storefront a11y: product detail (reached from shop)', async ({ page }) => {
  await page.goto('/shop', { waitUntil: 'load' })

  const firstProduct = page.locator('a[href^="/product/"]').first()
  await firstProduct.waitFor({ state: 'attached' })
  await firstProduct.click()
  await page.waitForURL(/\/product\//)

  await expectNoBlockingViolations(page, 'product detail')
})

// ── Skip link ────────────────────────────────────────────────────────────
//
// A bare `id` target is not enough: Safari does not move focus to a
// non-focusable fragment target, and Chrome/Firefox only move the sequential
// focus starting point, leaving document.activeElement on <body>. These assert
// focus actually lands on the landmark, in both layouts that render one.

for (const { name, path } of [
  { name: 'store', path: '/' },
  { name: 'auth', path: '/login' },
]) {
  test(`skip link moves focus to the main landmark (${name} layout)`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'load' })

    await page.keyboard.press('Tab')
    const skipLink = page.getByRole('link', { name: /skip to main content/i })
    await expect(skipLink).toBeFocused()

    await skipLink.press('Enter')
    await expect(page.locator('main#main')).toBeFocused()
  })
}

// ── Cart drawer: modal dialog semantics and focus management ─────────────
//
// The drawer is the storefront's only modal, and all of its accessibility
// behaviour is client-side, so none of it is exercised by the static scans
// above. Seeding the cart also gives a reliable hydration barrier: the count
// badge only renders after zustand rehydrates from localStorage.

test.describe('cart drawer', () => {
  async function openDrawer(page: Page, itemCount: number, qty = 1) {
    await seedCart(page, itemCount, qty)
    await page.goto('/', { waitUntil: 'load' })

    const trigger = page.getByRole('button', { name: /open cart/i })
    // The badge shows total quantity and renders only post-hydration — proves
    // React has attached before we try to click.
    await expect(trigger.getByText(String(itemCount * qty), { exact: true })).toBeVisible()
    await trigger.click()

    return { trigger, dialog: page.getByRole('dialog') }
  }

  test('opens as a labelled modal dialog with no axe violations', async ({ page }) => {
    const { dialog } = await openDrawer(page, 1)

    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    // Labelled by the visible heading rather than a duplicated aria-label.
    await expect(dialog).toHaveAccessibleName(/cart/i)

    await expectNoBlockingViolations(page, 'home with cart drawer open')
  })

  test('moves focus to the close button on open', async ({ page }) => {
    const { dialog } = await openDrawer(page, 1)

    await expect(dialog.getByRole('button', { name: /close cart/i })).toBeFocused()
  })

  test('traps Tab within the dialog', async ({ page }) => {
    const { dialog } = await openDrawer(page, 1)

    // Walk forward well past the last control; focus must never leave the panel.
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab')
      const inside = await dialog.evaluate((panel) => panel.contains(document.activeElement))
      expect(inside, `focus escaped the dialog after ${i + 1} Tab presses`).toBe(true)
    }

    // And backwards.
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Shift+Tab')
      const inside = await dialog.evaluate((panel) => panel.contains(document.activeElement))
      expect(inside, `focus escaped the dialog after ${i + 1} Shift+Tab presses`).toBe(true)
    }
  })

  test('closes on Escape and restores focus to the trigger', async ({ page }) => {
    const { trigger, dialog } = await openDrawer(page, 1)

    await page.keyboard.press('Escape')

    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('keeps focus inside the dialog after removing an item', async ({ page }) => {
    const { dialog } = await openDrawer(page, 2)

    const removeButtons = dialog.getByRole('button', { name: /remove .* from cart/i })
    await expect(removeButtons).toHaveCount(2)

    // Removing a row unmounts the button that was just activated. Focus must
    // land on the row that took its place, not fall back to <body>.
    await removeButtons.first().click()
    await expect(removeButtons).toHaveCount(1)
    await expect(removeButtons.first()).toBeFocused()

    // Removing the last row empties the panel; focus falls back to Close.
    await removeButtons.first().click()
    await expect(removeButtons).toHaveCount(0)
    await expect(dialog.getByRole('button', { name: /close cart/i })).toBeFocused()
  })

  test('keeps focus on the decrement control at minimum quantity', async ({ page }) => {
    // Start at qty 2 so the control is live, then step down to the minimum.
    const { dialog } = await openDrawer(page, 1, 2)

    const decrease = dialog.getByRole('button', { name: /decrease quantity/i })
    await expect(decrease).toHaveAttribute('aria-disabled', 'false')
    await decrease.focus()
    await decrease.click()

    // aria-disabled rather than disabled, so the control stays focusable and
    // focus does not escape the dialog when the minimum is reached.
    await expect(decrease).toHaveAttribute('aria-disabled', 'true')
    await expect(decrease).toBeFocused()
  })
})

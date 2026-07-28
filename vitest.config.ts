import { defineConfig, configDefaults } from 'vitest/config'

// Vitest owns the unit suite only. Without an explicit exclude it also picks up
// `e2e/*.spec.ts`, which are Playwright tests — importing @playwright/test
// outside the Playwright runner throws "Playwright Test did not expect test()
// to be called here" and fails the whole run.
//
// Everything else is left at Vitest's defaults on purpose: the current unit
// tests are pure-node utility tests that import { describe, it, expect } from
// 'vitest' explicitly. Component tests that need jsdom should opt in per file
// with a `// @vitest-environment jsdom` docblock rather than slowing the whole
// suite down with a global environment.
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})

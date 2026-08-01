import { describe, it, expect } from 'vitest'
import en from '../../messages/en.json'
import rw from '../../messages/rw.json'

// src/i18n/request.ts loads exactly one locale file and next-intl has no
// fallback chain configured, so a key present in en.json but missing from
// rw.json is not a cosmetic gap — it throws at render time for every
// Kinyarwanda reader. Nothing else in the suite would catch that, because the
// tests and the a11y gate both run in English.

type Messages = Record<string, unknown>

function flatten(value: Messages, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) =>
    child !== null && typeof child === 'object' && !Array.isArray(child)
      ? flatten(child as Messages, `${prefix}${key}.`)
      : [`${prefix}${key}`]
  )
}

const enKeys = flatten(en as Messages)
const rwKeys = flatten(rw as Messages)

describe('locale message files', () => {
  it('has no English key missing from Kinyarwanda', () => {
    expect(enKeys.filter((key) => !rwKeys.includes(key))).toEqual([])
  })

  it('has no Kinyarwanda key missing from English', () => {
    expect(rwKeys.filter((key) => !enKeys.includes(key))).toEqual([])
  })

  it('leaves no message empty in either locale', () => {
    const empty = (messages: Messages, locale: string) =>
      flatten(messages)
        .filter((key) => {
          const value = key
            .split('.')
            .reduce<unknown>((node, part) => (node as Messages)?.[part], messages)
          return typeof value === 'string' && value.trim() === ''
        })
        .map((key) => `${locale}:${key}`)

    expect([...empty(en as Messages, 'en'), ...empty(rw as Messages, 'rw')]).toEqual([])
  })

  // Catches a translation that drops or renames an interpolated value, which
  // renders as a literal "{count}" rather than failing loudly.
  it('keeps the interpolation placeholders identical across locales', () => {
    // Only the ICU argument name counts: `{count, plural, ...}` and `{amount}`
    // are placeholders, while the `{No products}` and `{# products}` branch
    // bodies of a plural are ordinary translated text and differ by design.
    const placeholders = (text: string) =>
      [...text.matchAll(/\{\s*(\w+)\s*[,}]/g)].map((match) => match[1]).sort()

    const read = (messages: Messages, key: string) =>
      key.split('.').reduce<unknown>((node, part) => (node as Messages)?.[part], messages)

    const mismatched = enKeys.filter((key) => {
      const source = read(en as Messages, key)
      const target = read(rw as Messages, key)
      if (typeof source !== 'string' || typeof target !== 'string') return false
      return placeholders(source).join() !== placeholders(target).join()
    })

    expect(mismatched).toEqual([])
  })
})

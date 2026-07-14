import { describe, it, expect } from 'vitest'
import { normalizePhone, detectOperator } from './phone'

describe('normalizePhone', () => {
  it('normalizes local 07X numbers', () => {
    expect(normalizePhone('0781234567')).toBe('250781234567')
  })

  it('normalizes +250 numbers with spaces', () => {
    expect(normalizePhone('+250 78 123 4567')).toBe('250781234567')
  })

  it('accepts already-normalized 250 numbers', () => {
    expect(normalizePhone('250721234567')).toBe('250721234567')
  })

  it('accepts bare 7XXXXXXXX numbers', () => {
    expect(normalizePhone('781234567')).toBe('250781234567')
  })

  it('rejects non-mobile and malformed numbers', () => {
    expect(normalizePhone('0251234567')).toBeNull() // not 07X mobile
    expect(normalizePhone('078123')).toBeNull() // too short
    expect(normalizePhone('07812345678')).toBeNull() // too long
    expect(normalizePhone('')).toBeNull()
    expect(normalizePhone('not a phone')).toBeNull()
  })
})

describe('detectOperator', () => {
  it('maps 078/079 to MTN', () => {
    expect(detectOperator('250781234567')).toBe('MTN')
    expect(detectOperator('250791234567')).toBe('MTN')
  })

  it('maps 072/073 to Airtel', () => {
    expect(detectOperator('250721234567')).toBe('AIRTEL')
    expect(detectOperator('250731234567')).toBe('AIRTEL')
  })

  it('returns null for unknown prefixes', () => {
    expect(detectOperator('250751234567')).toBeNull()
  })
})

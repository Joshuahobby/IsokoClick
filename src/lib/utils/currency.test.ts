import { describe, it, expect } from 'vitest'
import { formatRwf, formatRwfCompact, formatDiscount } from './currency'

describe('formatRwf', () => {
  it('formats with thousands separators and RWF prefix', () => {
    expect(formatRwf(8500)).toBe('RWF 8,500')
  })
})

describe('formatRwfCompact', () => {
  it('keeps small amounts as full RWF', () => {
    expect(formatRwfCompact(950)).toBe('RWF 950')
  })

  it('shows one decimal for non-round thousands', () => {
    expect(formatRwfCompact(1500)).toBe('RWF 1.5K')
  })

  it('drops the decimal for round thousands', () => {
    expect(formatRwfCompact(25000)).toBe('RWF 25K')
  })

  it('truncates instead of rounding up across units', () => {
    expect(formatRwfCompact(1_999_999)).toBe('RWF 1.9M')
  })

  it('formats millions', () => {
    expect(formatRwfCompact(2_500_000)).toBe('RWF 2.5M')
  })
})

describe('formatDiscount', () => {
  it('computes the discount percentage', () => {
    expect(formatDiscount(24000, 19500)).toBe('-19%')
  })

  it('guards divide-by-zero and non-discounts', () => {
    expect(formatDiscount(0, 100)).toBe('-0%')
    expect(formatDiscount(-5, 100)).toBe('-0%')
    expect(formatDiscount(100, 100)).toBe('-0%')
    expect(formatDiscount(100, 150)).toBe('-0%')
  })
})

export function formatRwf(amount: number): string {
  return `RWF ${amount.toLocaleString('en-RW')}`
}

export function formatRwfCompact(amount: number): string {
  // One decimal unless the value is a whole unit, and truncate rather
  // than round so 1,500 → "1.5K" and 1,999,999 never shows as "2.0M"
  const compact = (value: number) => {
    const truncated = Math.floor(value * 10) / 10
    return Number.isInteger(truncated) ? String(truncated) : truncated.toFixed(1)
  }
  if (amount >= 1_000_000) return `RWF ${compact(amount / 1_000_000)}M`
  if (amount >= 1_000) return `RWF ${compact(amount / 1_000)}K`
  return formatRwf(amount)
}

export function formatDiscount(original: number, sale: number): string {
  if (original <= 0 || sale >= original) return '-0%'
  const pct = Math.round(((original - sale) / original) * 100)
  return `-${pct}%`
}

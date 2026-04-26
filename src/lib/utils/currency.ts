export function formatRwf(amount: number): string {
  return `RWF ${amount.toLocaleString('en-RW')}`
}

export function formatRwfCompact(amount: number): string {
  if (amount >= 1_000_000) return `RWF ${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `RWF ${(amount / 1_000).toFixed(0)}K`
  return formatRwf(amount)
}

export function formatDiscount(original: number, sale: number): string {
  const pct = Math.round(((original - sale) / original) * 100)
  return `-${pct}%`
}

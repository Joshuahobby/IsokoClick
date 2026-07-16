// Rwandan MSISDN helpers used by checkout and payouts.

// Accepts 078..., +250 78..., 250 78... and returns 2507XXXXXXXX, or null.
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  const msisdn = digits.startsWith('250')
    ? digits
    : digits.startsWith('0')
      ? `250${digits.slice(1)}`
      : `250${digits}`
  return /^2507[0-9]{8}$/.test(msisdn) ? msisdn : null
}

// Operator prefixes: MTN 078/079, Airtel 072/073.
export function detectOperator(msisdn: string): 'MTN' | 'AIRTEL' | null {
  const sub = msisdn.slice(3, 5) // after '250'
  if (sub === '78' || sub === '79') return 'MTN'
  if (sub === '72' || sub === '73') return 'AIRTEL'
  return null
}

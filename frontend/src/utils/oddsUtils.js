export function impliedProb(americanOdds) {
  if (americanOdds >= 0) return 100 / (americanOdds + 100)
  return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100)
}

export function calcPayout(stake, americanOdds) {
  if (!stake || !americanOdds) return 0
  if (americanOdds >= 0) return stake + stake * (americanOdds / 100)
  return stake + stake * (100 / Math.abs(americanOdds))
}

export function calcProfit(stake, americanOdds) {
  return calcPayout(stake, americanOdds) - stake
}

export function formatOdds(odds) {
  if (odds == null) return '—'
  return odds > 0 ? `+${odds}` : `${odds}`
}

export function formatProb(prob) {
  return `${Math.round(prob * 100)}%`
}

export function vigLabel(home, away) {
  if (home == null || away == null) return null
  const total = impliedProb(home) + impliedProb(away)
  return `${((total - 1) * 100).toFixed(1)}%`
}

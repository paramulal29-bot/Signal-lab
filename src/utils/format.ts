export function formatUsd(value: number): string {
  const decimals = value >= 100 ? 2 : 4
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatPct(value: number, withSign = true): string {
  const sign = withSign && value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

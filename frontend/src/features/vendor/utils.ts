export function formatCurrency(value: number, symbol = "₦"): string {
  return `${symbol}${value.toLocaleString("en-NG")}`;
}

export function formatCompactCurrency(value: number, symbol = "₦"): string {
  if (value >= 1_000_000) {
    return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${symbol}${(value / 1_000).toFixed(0)}K`;
  }
  return `${symbol}${value}`;
}
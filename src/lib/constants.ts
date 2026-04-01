// STRC 优先股常量 - 盘盘STRC
// Source: SEC filings

export const TICKERS = {
  STRC: {
    symbol: 'STRC',
    name: 'Strategy 永续优先股',
    issuer: 'Strategy (原 MicroStrategy)',
    rate: 11.50,
    monthlyDividend: 0.9583,
    annualDividend: 11.50,
    parValue: 100.0,
    ipoDate: '2025-07-29',
    ipoShares: 28_011_111,
    ipoProceeds: 2_520_000_000,
    color: '#F7931A',
  },
} as const;

export type TickerSymbol = keyof typeof TICKERS;

// ATM Detection thresholds
export const ATM_CONFIG = {
  priceThreshold: 100.0, // ATM likely active when price >= $100
  defaultAtmPercentage: 50, // Assume 50% of volume is ATM when price < threshold
  fullAtmPercentage: 100, // Assume 100% ATM when price >= threshold
} as const;

// US Market hours (Eastern Time)
export const MARKET_HOURS = {
  open: { hour: 9, minute: 30 },
  close: { hour: 16, minute: 0 },
  timezone: 'America/New_York',
} as const;

// API endpoints
export const API = {
  coingecko: {
    price: 'https://api.coingecko.com/api/v3/simple/price',
    history: 'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart',
  },
  // Yahoo Finance via CORS proxy (fallback)
  yahoo: {
    chart: (symbol: string, range: string) =>
      `https://api.allorigins.win/raw?url=${encodeURIComponent(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=1d`
      )}`,
  },
  // strc.live — PRIMARY data source
  strc: {
    tickerData: 'https://strc.live/api/ticker-data',
    secFilings: 'https://strc.live/api/sec-filings',
  },
} as const;

// Formatting helpers
export function formatCurrency(value: number, compact = false): string {
  if (compact) {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number, compact = false): string {
  if (compact) {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatBtc(value: number): string {
  return `${value.toLocaleString('en-US')} BTC`;
}

// STRC 优先股财务计算

import { TICKERS, ATM_CONFIG, type TickerSymbol } from './constants';

// ============================================
// Yield Calculations
// ============================================

/**
 * Calculate current yield based on market price
 * Yield = (Annual Dividend / Market Price) * 100
 */
export function calculateYield(ticker: TickerSymbol, marketPrice: number): number {
  if (marketPrice <= 0) return 0;
  const info = TICKERS[ticker];
  return (info.annualDividend / marketPrice) * 100;
}

/**
 * Calculate price vs par value
 * Negative = trading below par (discount)
 * Positive = trading above par (premium)
 */
export function calculateVsPar(ticker: TickerSymbol, marketPrice: number): number {
  const info = TICKERS[ticker];
  return marketPrice - info.parValue;
}

/**
 * Calculate the vs par percentage
 */
export function calculateVsParPercent(ticker: TickerSymbol, marketPrice: number): number {
  const info = TICKERS[ticker];
  if (info.parValue === 0) return 0;
  return ((marketPrice - info.parValue) / info.parValue) * 100;
}

// ============================================
// ATM Detection / Estimation
// ============================================

export type AtmStatus = 'active' | 'standby' | 'inactive' | 'loading';

/**
 * Determine ATM status based on price and volume
 */
export function getAtmStatus(
  marketPrice: number,
  volume: number,
  avgVolume: number = 0
): AtmStatus {
  if (marketPrice <= 0) return 'loading';
  
  // If price is at or above par, ATM is likely active
  if (marketPrice >= ATM_CONFIG.priceThreshold) {
    // High volume confirms active selling
    if (avgVolume > 0 && volume > avgVolume * 1.5) {
      return 'active';
    }
    return 'active';
  }
  
  // Below threshold but still trading
  if (marketPrice >= ATM_CONFIG.priceThreshold * 0.98) {
    return 'standby'; // Close to threshold
  }
  
  return 'inactive';
}

/**
 * Estimate ATM volume from total volume
 * When price >= $100: assume 100% is ATM
 * When price < $100: assume 50% is ATM
 */
export function estimateAtmVolume(
  totalVolume: number,
  marketPrice: number
): number {
  if (totalVolume <= 0) return 0;
  
  const percentage = marketPrice >= ATM_CONFIG.priceThreshold
    ? ATM_CONFIG.fullAtmPercentage
    : ATM_CONFIG.defaultAtmPercentage;
  
  return Math.round(totalVolume * (percentage / 100));
}

/**
 * Estimate BTC purchased from ATM volume and prices
 */
export function estimateBtcPurchased(
  atmVolume: number,
  sharePrice: number,
  btcPrice: number
): number {
  if (atmVolume <= 0 || sharePrice <= 0 || btcPrice <= 0) return 0;
  const proceeds = atmVolume * sharePrice;
  return proceeds / btcPrice;
}

// ============================================
// Income Calculations
// ============================================

/**
 * Calculate monthly income from shares
 */
export function calculateMonthlyIncome(
  ticker: TickerSymbol,
  shares: number
): number {
  const info = TICKERS[ticker];
  return shares * info.monthlyDividend;
}

/**
 * Calculate annual income from shares
 */
export function calculateAnnualIncome(
  ticker: TickerSymbol,
  shares: number
): number {
  return calculateMonthlyIncome(ticker, shares) * 12;
}

/**
 * Calculate shares needed for target monthly income
 */
export function sharesForMonthlyIncome(
  ticker: TickerSymbol,
  targetMonthly: number
): number {
  const info = TICKERS[ticker];
  if (info.monthlyDividend <= 0) return 0;
  return Math.ceil(targetMonthly / info.monthlyDividend);
}

/**
 * Calculate investment needed for target monthly income at current price
 */
export function investmentForMonthlyIncome(
  ticker: TickerSymbol,
  targetMonthly: number,
  sharePrice: number
): number {
  const shares = sharesForMonthlyIncome(ticker, targetMonthly);
  return shares * sharePrice;
}

// ============================================
// Sustainability Model
// ============================================

/**
 * Calculate cash runway in months
 * How many months can dividends be sustained from USD reserves
 */
export function calculateCashRunway(
  usdReserves: number,
  totalSharesOutstanding: number,
  monthlyDividendPerShare: number
): number {
  const monthlyObligation = totalSharesOutstanding * monthlyDividendPerShare;
  if (monthlyObligation <= 0) return Infinity;
  return usdReserves / monthlyObligation;
}

/**
 * Calculate BTC coverage ratio
 * How many years of dividends are covered by BTC holdings at current price
 */
export function calculateBtcCoverage(
  btcHoldings: number,
  btcPrice: number,
  totalSharesOutstanding: number,
  annualDividendPerShare: number
): number {
  const btcValue = btcHoldings * btcPrice;
  const annualObligation = totalSharesOutstanding * annualDividendPerShare;
  if (annualObligation <= 0) return Infinity;
  return btcValue / annualObligation;
}

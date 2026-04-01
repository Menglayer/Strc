// API layer for fetching real-time data
// PRIMARY: strc.live API (STRC price, BTC price, dividends, filings, correlation)
// FALLBACK: CoinGecko (BTC), Yahoo Finance (STRC)

import { API } from './constants';

// ============================================
// strc.live API Types
// ============================================

export interface StrcDividendCurrent {
  exDate: string;
  payDate: string;
  declarationDate: string | null;
  recordDate: string;
  amount: number;
  frequency: null;
  distributionType: string;
  annualizedRate: number;
}

export interface StrcDividendHistory {
  exDate: string;
  payDate: string;
  declarationDate: string | null;
  recordDate: string;
  amount: number;
  frequency: null;
  distributionType: string;
  recoveryDate: string;
  recoveryDays: number;
}

export interface StrcBtcCorrelation {
  current: number;
  windowDays: number;
  history: Array<{ date: string; correlation: number }>;
}

export interface StrcTickerInfo {
  ipoDate: string;
  history: Array<{
    date: string;
    close: number;
    high: number;
    low: number;
    volume: number;
    source: string;
  }>;
  latest: {
    date: string;
    close: number;
    high: number;
    low: number;
    volume: number;
    source: string;
  };
  closePrice: number;
  previousClose: number;
  dividends: {
    current: StrcDividendCurrent;
    history: StrcDividendHistory[];
    rateSource: string;
  };
  btcCorrelation: StrcBtcCorrelation;
  summary: {
    annualizedDividend: number;
    currentYield: number;
    exDividendDate: string;
    rateSource: string;
  };
  extendedHoursPrice: number;
  extendedHoursChange: number;
  extendedHoursChangePercent: number;
  extendedHoursTimestamp: number;
}

export interface StrcTickerDataResponse {
  success: boolean;
  updated: string;
  btcPrice: number;
  btcHistory: Record<string, number>;
  riskFreeRate: number;
  tickers: {
    STRC: StrcTickerInfo;
  };
}

export interface StrcSecFiling {
  ticker: string;
  filedDate: string;
  url: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  sharesSold: number;
  netProceeds: number;
  btcPurchased: number | null;
  avgBtcPrice: number;
  offeringType: string;
}

export interface StrcSecFilingsResponse {
  success: boolean;
  filings: StrcSecFiling[];
}

// ============================================
// strc.live API Clients (PRIMARY)
// ============================================

let cachedTickerData: StrcTickerDataResponse | null = null;
let tickerDataTimestamp = 0;
const TICKER_CACHE_MS = 30_000; // 30s cache

export async function fetchStrcTickerData(): Promise<StrcTickerDataResponse> {
  const now = Date.now();
  if (cachedTickerData && now - tickerDataTimestamp < TICKER_CACHE_MS) {
    return cachedTickerData;
  }

  const res = await fetch(API.strc.tickerData);
  if (!res.ok) throw new Error(`strc.live ticker-data API error: ${res.status}`);
  const data: StrcTickerDataResponse = await res.json();
  
  cachedTickerData = data;
  tickerDataTimestamp = now;
  return data;
}

export async function fetchStrcSecFilings(): Promise<StrcSecFiling[]> {
  const res = await fetch(API.strc.secFilings);
  if (!res.ok) throw new Error(`strc.live sec-filings API error: ${res.status}`);
  const data: StrcSecFilingsResponse = await res.json();
  
  // Filter to STRC only
  return data.filings.filter(f => f.ticker === 'STRC');
}

// ============================================
// Bitcoin Price (CoinGecko — fallback)
// ============================================

export interface BtcPriceData {
  price: number;
  change24h: number;
  changePercent24h: number;
  lastUpdated: number;
}

export async function fetchBtcPrice(): Promise<BtcPriceData> {
  // Try strc.live first
  try {
    const data = await fetchStrcTickerData();
    const btcPrice = data.btcPrice;
    return {
      price: btcPrice,
      change24h: 0,
      changePercent24h: 0,
      lastUpdated: Date.now(),
    };
  } catch {
    // Fallback to CoinGecko
  }

  const url = `${API.coingecko.price}?ids=bitcoin&vs_currencies=usd&include_24hr_change=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
  
  const data = await res.json();
  const btc = data.bitcoin;
  
  return {
    price: btc.usd,
    change24h: btc.usd * (btc.usd_24h_change / 100),
    changePercent24h: btc.usd_24h_change,
    lastUpdated: Date.now(),
  };
}

// ============================================
// BTC Price History (from strc.live btcHistory)
// ============================================

export interface PricePoint {
  time: number; // unix timestamp in seconds
  value: number;
}

export async function fetchBtcHistory(days: number = 30): Promise<PricePoint[]> {
  // Try strc.live first
  try {
    const data = await fetchStrcTickerData();
    const entries = Object.entries(data.btcHistory)
      .map(([date, price]) => ({
        time: Math.floor(new Date(date).getTime() / 1000),
        value: price,
      }))
      .sort((a, b) => a.time - b.time);
    
    if (days > 0) {
      const cutoff = Date.now() / 1000 - days * 86400;
      return entries.filter(e => e.time >= cutoff);
    }
    return entries;
  } catch {
    // Fallback to CoinGecko
  }

  const url = `${API.coingecko.history}?vs_currency=usd&days=${days}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko history API error: ${res.status}`);
  
  const data = await res.json();
  return data.prices.map(([timestamp, price]: [number, number]) => ({
    time: Math.floor(timestamp / 1000),
    value: price,
  }));
}

// ============================================
// Stock Price (from strc.live, fallback Yahoo)
// ============================================

export interface StockQuote {
  symbol: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
  // Extended hours data from strc.live
  extendedHoursPrice?: number;
  extendedHoursChange?: number;
  extendedHoursChangePercent?: number;
}

export async function fetchStockQuote(symbol: string): Promise<StockQuote | null> {
  // Try strc.live first for STRC
  if (symbol.toUpperCase() === 'STRC') {
    try {
      const data = await fetchStrcTickerData();
      const strc = data.tickers.STRC;
      const price = strc.closePrice;
      const previousClose = strc.previousClose;
      const change = price - previousClose;
      const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

      return {
        symbol: 'STRC',
        price,
        previousClose,
        change,
        changePercent,
        volume: strc.latest.volume,
        timestamp: Date.now(),
        extendedHoursPrice: strc.extendedHoursPrice,
        extendedHoursChange: strc.extendedHoursChange,
        extendedHoursChangePercent: strc.extendedHoursChangePercent,
      };
    } catch {
      // Fallback to Yahoo
    }
  }

  try {
    const url = API.yahoo.chart(symbol, '1d');
    const res = await fetch(url);
    if (!res.ok) return null;
    
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;
    
    const meta = result.meta;
    const price = meta.regularMarketPrice ?? 0;
    const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
    
    return {
      symbol: symbol.toUpperCase(),
      price,
      previousClose,
      change,
      changePercent,
      volume: meta.regularMarketVolume ?? 0,
      timestamp: Date.now(),
    };
  } catch {
    return null;
  }
}

// ============================================
// Stock Price History (from strc.live, fallback Yahoo)
// ============================================

export async function fetchStockHistory(
  symbol: string,
  range: '1d' | '5d' | '1mo' | '3mo' = '1mo'
): Promise<PricePoint[]> {
  // Try strc.live first for STRC
  if (symbol.toUpperCase() === 'STRC') {
    try {
      const data = await fetchStrcTickerData();
      const strc = data.tickers.STRC;
      const allPoints = strc.history.map(h => ({
        time: Math.floor(new Date(h.date).getTime() / 1000),
        value: h.close,
      })).sort((a, b) => a.time - b.time);

      const rangeDays: Record<string, number> = { '1d': 1, '5d': 5, '1mo': 30, '3mo': 90 };
      const days = rangeDays[range] ?? 30;
      const cutoff = Date.now() / 1000 - days * 86400;
      return allPoints.filter(p => p.time >= cutoff);
    } catch {
      // Fallback to Yahoo
    }
  }

  try {
    const url = API.yahoo.chart(symbol, range);
    const res = await fetch(url);
    if (!res.ok) return [];
    
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return [];
    
    const timestamps: number[] = result.timestamp ?? [];
    const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];
    
    return timestamps
      .map((t, i) => ({
        time: t,
        value: closes[i],
      }))
      .filter((p) => p.value != null && !isNaN(p.value));
  } catch {
    return [];
  }
}

// ============================================
// Market Status
// ============================================

export function isMarketOpen(): boolean {
  const now = new Date();
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = et.getDay();
  const hour = et.getHours();
  const minute = et.getMinutes();
  const timeInMinutes = hour * 60 + minute;
  
  // Weekdays only (Mon=1 to Fri=5)
  if (day === 0 || day === 6) return false;
  
  // Market hours: 9:30 AM - 4:00 PM ET
  const marketOpen = 9 * 60 + 30; // 9:30
  const marketClose = 16 * 60; // 16:00
  
  return timeInMinutes >= marketOpen && timeInMinutes < marketClose;
}



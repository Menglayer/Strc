import React, { useEffect, useState } from 'react';
import { 
  fetchStrcTickerData,
  fetchStockHistory, 
  isMarketOpen,
  type StrcTickerDataResponse,
  type PricePoint 
} from '../../lib/api';
import { 
  calculateYield, 
  calculateVsPar, 
  getAtmStatus, 
  type AtmStatus 
} from '../../lib/calculations';
import { 
  TICKERS, 
  formatCurrency, 
  type TickerSymbol 
} from '../../lib/constants';
import { GlassCard } from '../ui/GlassCard';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { StatusBadge } from '../ui/StatusBadge';
import { Skeleton } from '../ui/Skeleton';
import { PriceChart } from '../charts/PriceChart';

interface TickerDetailProps {
  symbol: string;
}

type TimeRange = '1d' | '5d' | '1mo';

export function TickerDetail({ symbol }: TickerDetailProps) {
  const tickerKey = symbol.toUpperCase() as TickerSymbol;
  const tickerInfo = TICKERS[tickerKey];
  
  const [tickerData, setTickerData] = useState<StrcTickerDataResponse | null>(null);
  const [history, setHistory] = useState<PricePoint[]>([]);
  
  const [range, setRange] = useState<TimeRange>('1mo');
  const [isLoading, setIsLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(true);

  const RANGES: { label: string; value: TimeRange }[] = [
    { label: '1D', value: '1d' },
    { label: '5D', value: '5d' },
    { label: '30D', value: '1mo' },
  ];

  // Load initial data
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const data = await fetchStrcTickerData();
        if (mounted) {
          if (data) setTickerData(data);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        if (mounted) setIsLoading(false);
      }
    };

    loadData();

    // Polling
    const interval = setInterval(async () => {
      const data = await fetchStrcTickerData();
      if (mounted && data) setTickerData(data);
    }, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Load chart data
  useEffect(() => {
    let mounted = true;
    const loadHistory = async () => {
      setIsChartLoading(true);
      try {
        const data = await fetchStockHistory(symbol, range);
        if (mounted) {
          setHistory(data);
        }
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        if (mounted) setIsChartLoading(false);
      }
    };
    loadHistory();
    return () => { mounted = false; };
  }, [symbol, range]);

  const strcData = tickerData?.tickers?.STRC;
  const currentPrice = strcData?.closePrice ?? 0;
  const previousClose = strcData?.previousClose ?? 0;
  const changeAmt = currentPrice > 0 && previousClose > 0 ? currentPrice - previousClose : 0;
  const changePct = previousClose > 0 ? (changeAmt / previousClose) * 100 : 0;
  const volume = strcData?.latest?.volume ?? 0;
  const isPositive = changeAmt >= 0;
  const changeColor = isPositive ? 'text-green' : 'text-red';
  const changeSign = isPositive ? '+' : '';

  const yieldPct = currentPrice > 0 ? calculateYield(tickerKey, currentPrice) : 0;
  const vsPar = currentPrice > 0 ? calculateVsPar(tickerKey, currentPrice) : 0;
  const vsParPositive = vsPar >= 0;
  const vsParColor = vsParPositive ? 'text-green' : 'text-red';
  const vsParSign = vsParPositive ? '+' : '';

  const atmStatus = currentPrice > 0 ? getAtmStatus(currentPrice, volume) : 'loading';
  const atmStatusLabel = atmStatus === 'active' 
    ? "价格≥$100，ATM激活" 
    : atmStatus === 'standby' 
    ? "接近$100阈值" 
    : atmStatus === 'inactive' 
    ? "低于$100阈值" 
    : "计算中...";

  const chartColor = tickerInfo?.color ?? '#F7931A';

  // Helper to construct RGBA colors based on hex
  const getRgba = (hex: string, alpha: number) => {
    let r = 247, g = 147, b = 26; // fallback btc orange
    if (hex === '#FFFFFF') {
      r = 255; g = 255; b = 255;
    } else if (hex === '#F7931A') {
      r = 247; g = 147; b = 26;
    }
    return `rgba(${r},${g},${b},${alpha})`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <GlassCard className="lg:col-span-2 flex flex-col">
        {isLoading ? (
          <div className="mb-4 space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : (
          <div className="mb-4">
            <div className="flex items-center gap-4">
              <span className="text-4xl font-mono font-bold text-white">
                <AnimatedNumber value={currentPrice} prefix="$" decimals={2} />
              </span>
              <span className="text-sm text-muted">最新收盘价</span>
            </div>
            {currentPrice > 0 && (
              <div className={`text-sm mt-1 font-mono ${changeColor}`}>
                {changeSign}${Math.abs(changeAmt).toFixed(2)} ({changeSign}{changePct.toFixed(2)}%)
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 mb-4">
          {RANGES.map((r) => {
            const isActive = range === r.value;
            return (
              <button
                type="button"
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  isActive 
                    ? 'bg-btc/20 text-btc' 
                    : 'bg-white/5 text-muted hover:bg-white/10 hover:text-white'
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        <div className="w-full flex-grow min-h-[300px]">
          <PriceChart 
            data={history} 
            loading={isChartLoading || isLoading} 
            height={300}
            lineColor={chartColor}
            topColor={getRgba(chartColor, 0.3)}
            bottomColor={getRgba(chartColor, 0.02)}
          />
        </div>
      </GlassCard>

      <div className="space-y-4">
        <GlassCard>
          <h3 className="text-xs text-muted font-medium uppercase tracking-wider mb-1">当前收益率</h3>
          {isLoading ? (
            <Skeleton className="h-9 w-24 mb-1" />
          ) : (
            <div className="text-3xl font-mono font-bold text-green">
              <AnimatedNumber value={yieldPct} decimals={2} />%
            </div>
          )}
          <p className="text-xs text-muted mt-1">
            每股 ${tickerInfo.monthlyDividend.toFixed(4)}/月
          </p>
        </GlassCard>

        <GlassCard>
          <h3 className="text-xs text-muted font-medium uppercase tracking-wider mb-1">vs面值</h3>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mb-1" />
          ) : (
            <div className={`text-2xl font-mono font-bold ${vsParColor}`}>
              {vsPar === 0 && currentPrice === 0 
                ? '--' 
                : `${vsParSign}$${Math.abs(vsPar).toFixed(2)}`}
            </div>
          )}
          <p className="text-xs text-muted mt-1">
            面值: ${tickerInfo.parValue.toFixed(2)}
          </p>
        </GlassCard>

        <GlassCard>
          <h3 className="text-xs text-muted font-medium uppercase tracking-wider mb-2">ATM引擎状态</h3>
          {isLoading ? (
            <Skeleton className="h-6 w-20 mb-2" />
          ) : (
            <StatusBadge 
              status={atmStatus} 
              label={atmStatus.charAt(0).toUpperCase() + atmStatus.slice(1)} 
            />
          )}
          <p className="text-xs text-muted mt-2">{atmStatusLabel}</p>
        </GlassCard>

        <GlassCard>
          <h3 className="text-xs text-muted font-medium uppercase tracking-wider mb-1">发行方</h3>
          <p className="text-sm text-white font-medium">{tickerInfo.issuer}</p>
        </GlassCard>

        <GlassCard>
          <h3 className="text-xs text-muted font-medium uppercase tracking-wider mb-1">BTC关联度</h3>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mb-1" />
          ) : (
            <div className={`text-2xl font-mono font-bold ${(strcData?.btcCorrelation?.current ?? 0) >= 0 ? 'text-green' : 'text-red'}`}>
              {!strcData ? '--' : (strcData.btcCorrelation.current > 0 ? '+' : '') + (strcData.btcCorrelation.current).toFixed(2)}
            </div>
          )}
          <p className="text-xs text-muted mt-1">
            {strcData?.btcCorrelation?.windowDays ?? '--'}天窗口期
          </p>
        </GlassCard>

        {strcData?.extendedHoursPrice && strcData.extendedHoursPrice > 0 ? (
          <GlassCard>
            <h3 className="text-xs text-muted font-medium uppercase tracking-wider mb-1">盘后交易</h3>
            <div className="text-2xl font-mono font-bold text-white">
              <AnimatedNumber value={strcData.extendedHoursPrice} prefix="$" decimals={2} />
            </div>
            <div className={`text-xs mt-1 font-mono ${strcData.extendedHoursChange >= 0 ? 'text-green' : 'text-red'}`}>
              {strcData.extendedHoursChange >= 0 ? '+' : ''}{strcData.extendedHoursChange.toFixed(2)} ({strcData.extendedHoursChange >= 0 ? '+' : ''}{strcData.extendedHoursChangePercent.toFixed(2)}%)
            </div>
            <p className="text-xs text-muted mt-1">盘后价格</p>
          </GlassCard>
        ) : null}

        <GlassCard>
          <h3 className="text-xs text-muted font-medium uppercase tracking-wider mb-1">下次除息</h3>
          {isLoading ? (
             <Skeleton className="h-8 w-24 mb-1" />
          ) : (
            <>
              <div className="text-2xl font-mono font-bold text-white">
                {strcData?.dividends?.current?.exDate ? new Date(strcData.dividends.current.exDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) : '--'}
              </div>
              <div className="text-sm font-mono text-white mt-1">
                ${strcData?.dividends?.current?.amount?.toFixed(4) ?? '--'} / 股
              </div>
              <p className="text-xs text-muted mt-1">
                年化利率 {strcData?.dividends?.current?.annualizedRate ? (strcData.dividends.current.annualizedRate * 100).toFixed(2) : '--'}%
              </p>
            </>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

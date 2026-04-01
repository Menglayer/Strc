import React, { useState, useEffect } from 'react';
import { TICKERS, formatCurrency, formatNumber } from '../../lib/constants';
import { fetchStrcTickerData } from '../../lib/api';
import { GlassCard } from '../ui/GlassCard';
import { AnimatedNumber } from '../ui/AnimatedNumber';

export function DCACalculator() {
  const [monthlyAmount, setMonthlyAmount] = useState<number>(1000);
  const [months, setMonths] = useState<number>(24);
  const [sharePrice, setSharePrice] = useState<number>(100.00);
  const [livePriceLoaded, setLivePriceLoaded] = useState(false);

  useEffect(() => {
    fetchStrcTickerData()
      .then(data => {
        const price = data.tickers.STRC.closePrice;
        if (price > 0) {
          setSharePrice(parseFloat(price.toFixed(2)));
          setLivePriceLoaded(true);
        }
      })
      .catch(err => console.error('Failed to fetch live price:', err));
  }, []);

  const monthlyDividend = TICKERS.STRC.monthlyDividend;

  // Build month-by-month DCA accumulation
  let totalInvested = 0;
  let totalShares = 0;
  let totalDividends = 0;
  const timeline: { month: number; invested: number; shares: number; dividends: number; value: number }[] = [];

  for (let m = 1; m <= months; m++) {
    // Buy shares this month
    const newShares = sharePrice > 0 ? Math.floor(monthlyAmount / sharePrice) : 0;
    totalInvested += monthlyAmount;
    totalShares += newShares;
    // Collect dividends on ALL accumulated shares this month
    const divThisMonth = totalShares * monthlyDividend;
    totalDividends += divThisMonth;

    if (m === 1 || m === Math.ceil(months / 4) || m === Math.ceil(months / 2) || m === Math.ceil(months * 3 / 4) || m === months) {
      timeline.push({
        month: m,
        invested: totalInvested,
        shares: totalShares,
        dividends: totalDividends,
        value: totalShares * sharePrice,
      });
    }
  }

  // Deduplicate timeline entries by month
  const seen = new Set<number>();
  const uniqueTimeline = timeline.filter(t => {
    if (seen.has(t.month)) return false;
    seen.add(t.month);
    return true;
  });

  const avgCost = totalShares > 0 ? totalInvested / totalShares : 0;
  const portfolioValue = totalShares * sharePrice;
  const monthlyIncome = totalShares * monthlyDividend;
  const annualIncome = monthlyIncome * 12;
  const yieldOnCost = totalInvested > 0 ? (annualIncome / totalInvested) * 100 : 0;

  const maxValue = uniqueTimeline.length > 0 ? Math.max(...uniqueTimeline.map(t => t.value)) : 1;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div>
            <label htmlFor="dca-monthly" className="text-sm text-muted font-medium mb-1 block">每月投入 ($)</label>
            <input
              id="dca-monthly"
              type="number"
              value={monthlyAmount}
              onChange={(e) => setMonthlyAmount(Number(e.target.value))}
              step={100}
              min={0}
              className="bg-dark/50 border border-white/10 rounded-lg px-4 py-2 text-white font-mono focus:border-btc focus:outline-none focus:ring-1 focus:ring-btc/50 w-full transition-colors"
            />
          </div>

          <div>
            <label htmlFor="dca-months" className="text-sm text-muted font-medium mb-1 flex justify-between">
              <span>定投期限</span>
              <span className="text-white font-mono">{months} 个月</span>
            </label>
            <input
              id="dca-months"
              type="range"
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              min={1}
              max={120}
              className="w-full accent-[#F7931A] cursor-pointer"
            />
          </div>

          <div>
            <label htmlFor="dca-price" className="text-sm text-muted font-medium mb-1 block">
              买入均价 ($)
              {livePriceLoaded && <span className="ml-2 text-xs text-green-400">· 实时</span>}
            </label>
            <input
              id="dca-price"
              type="number"
              value={sharePrice}
              onChange={(e) => setSharePrice(Number(e.target.value))}
              step={0.01}
              min={0.01}
              className="bg-dark/50 border border-white/10 rounded-lg px-4 py-2 text-white font-mono focus:border-btc focus:outline-none focus:ring-1 focus:ring-btc/50 w-full transition-colors"
            />
          </div>
        </div>

        {/* Hero Result */}
        <div className="flex flex-col justify-center items-center h-full min-h-[200px] p-6 rounded-2xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent relative overflow-hidden group">
          <div className="absolute inset-0 bg-btc/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <span className="text-muted text-sm uppercase tracking-widest mb-2 z-10">累计分红收入</span>
          <div className="text-5xl md:text-6xl font-display font-bold text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.3)] z-10 flex items-baseline gap-1">
            <span className="text-3xl text-green-500/70">$</span>
            <AnimatedNumber value={totalDividends} decimals={0} />
          </div>
          <span className="text-xs text-muted mt-4 font-mono z-10 text-center">
            {months} 个月定投 · {formatNumber(totalShares)} 股
          </span>
          <div className="mt-4 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-mono text-white">
            月收入: $<AnimatedNumber value={monthlyIncome} decimals={2} />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="border-t border-white/10 pt-6 mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard className="p-4 flex flex-col hover:border-white/20 transition-colors">
            <span className="text-muted text-xs uppercase mb-1">总投入</span>
            <span className="font-mono font-bold text-xl text-white">
              {formatCurrency(totalInvested, true)}
            </span>
          </GlassCard>

          <GlassCard className="p-4 flex flex-col hover:border-white/20 transition-colors">
            <span className="text-muted text-xs uppercase mb-1">持仓价值</span>
            <span className="font-mono font-bold text-xl text-white">
              {formatCurrency(portfolioValue, true)}
            </span>
          </GlassCard>

          <GlassCard className="p-4 flex flex-col hover:border-white/20 transition-colors">
            <span className="text-muted text-xs uppercase mb-1">平均成本</span>
            <span className="font-mono font-bold text-xl text-white">
              {formatCurrency(avgCost)}
            </span>
          </GlassCard>

          <GlassCard className="p-4 flex flex-col hover:border-white/20 transition-colors">
            <span className="text-muted text-xs uppercase mb-1">成本收益率</span>
            <span className="font-mono font-bold text-xl text-btc">
              <AnimatedNumber value={yieldOnCost} decimals={2} />%
            </span>
          </GlassCard>
        </div>
      </div>

      {/* Growth Timeline */}
      <GlassCard className="p-6">
        <h3 className="text-sm text-muted font-medium mb-6 uppercase tracking-wider">定投增长时间线</h3>
        <div className="space-y-4">
          {uniqueTimeline.map(t => {
            const pct = maxValue > 0 ? (t.value / maxValue) * 100 : 0;
            return (
              <div key={t.month} className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-muted">第{t.month}月</span>
                  <span className="text-white">
                    {formatNumber(t.shares)} 股 · 分红 {formatCurrency(t.dividends, true)}
                  </span>
                </div>
                <div className="h-2 w-full bg-dark/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-btc/50 to-btc rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.max(pct, 1)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <p className="text-center text-xs text-muted/50 mt-8 max-w-2xl mx-auto">
        本计算器假设每月定额买入且股价不变。实际DCA策略中价格波动会影响平均成本。不考虑交易费用、税费或股息再投资。
      </p>
    </div>
  );
}

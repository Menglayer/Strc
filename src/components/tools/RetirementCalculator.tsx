import React, { useState } from 'react';
import { TICKERS, formatCurrency, formatNumber, type TickerSymbol } from '../../lib/constants';
import { calculateYield, calculateMonthlyIncome, calculateAnnualIncome } from '../../lib/calculations';
import { GlassCard } from '../ui/GlassCard';
import { AnimatedNumber } from '../ui/AnimatedNumber';

export function RetirementCalculator() {
  const [investment, setInvestment] = useState<number>(100000);
  const [ticker, setTicker] = useState<TickerSymbol>('STRC');
  const [sharePrice, setSharePrice] = useState<number>(100.00);
  const [years, setYears] = useState<number>(20);

  const shares = sharePrice > 0 ? Math.floor(investment / sharePrice) : 0;
  const monthlyIncome = calculateMonthlyIncome(ticker, shares);
  const annualIncome = calculateAnnualIncome(ticker, shares);
  const totalIncome = annualIncome * years;
  const currentYield = calculateYield(ticker, sharePrice);

  const timelineYears = [1, 5, 10, years].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
  const maxTimelineIncome = annualIncome * Math.max(...timelineYears, 1);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
           <div>
             <label htmlFor="inv-amount" className="text-sm text-muted font-medium mb-1 block">投资金额 ($)</label>
             <input
              id="inv-amount"
              type="number"
              value={investment}
              onChange={(e) => setInvestment(Number(e.target.value))}
              step={1000}
              min={0}
              className="bg-dark/50 border border-white/10 rounded-lg px-4 py-2 text-white font-mono focus:border-btc focus:outline-none focus:ring-1 focus:ring-btc/50 w-full transition-colors"
            />
          </div>

           <div>
             <span className="text-sm text-muted font-medium mb-1 block">资产</span>
             <div className="bg-dark/50 border border-white/10 rounded-lg px-4 py-2 text-white font-mono text-sm">
               STRC
             </div>
           </div>

           <div>
             <label htmlFor="share-price" className="text-sm text-muted font-medium mb-1 block">股价 ($)</label>
             <input
              id="share-price"
              type="number"
              value={sharePrice}
              onChange={(e) => setSharePrice(Number(e.target.value))}
              step={0.01}
              min={0.01}
              className="bg-dark/50 border border-white/10 rounded-lg px-4 py-2 text-white font-mono focus:border-btc focus:outline-none focus:ring-1 focus:ring-btc/50 w-full transition-colors"
            />
          </div>

           <div>
             <label htmlFor="years" className="text-sm text-muted font-medium mb-1 flex justify-between">
               <span>退休年限</span>
               <span className="text-white font-mono">{years} 年</span>
             </label>
            <input
              id="years"
              type="range"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              min={1}
              max={40}
              className="w-full accent-[#F7931A] cursor-pointer"
            />
          </div>
        </div>

        {/* Hero Result */}
        <div className="flex flex-col justify-center items-center h-full min-h-[200px] p-6 rounded-2xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent relative overflow-hidden group">
          <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
           <span className="text-muted text-sm uppercase tracking-widest mb-2 z-10">月收入</span>
          <div className="text-5xl md:text-6xl font-display font-bold text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.3)] z-10 flex items-baseline gap-1">
            <span className="text-3xl text-green-500/70">$</span>
            <AnimatedNumber value={monthlyIncome} decimals={2} />
          </div>
           <span className="text-xs text-muted mt-4 font-mono z-10 text-center">
             {formatNumber(shares)} 股 @ {formatCurrency(TICKERS[ticker].monthlyDividend)}/月
           </span>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="border-t border-white/10 pt-6 mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <GlassCard className="p-4 flex flex-col hover:border-white/20 transition-colors">
             <span className="text-muted text-xs uppercase mb-1">持有股数</span>
             <span className="font-mono font-bold text-xl text-white">
               <AnimatedNumber value={shares} decimals={0} />
             </span>
           </GlassCard>
          
           <GlassCard className="p-4 flex flex-col hover:border-white/20 transition-colors">
             <span className="text-muted text-xs uppercase mb-1">年收入</span>
             <span className="font-mono font-bold text-xl text-white">
               $<AnimatedNumber value={annualIncome} decimals={2} />
             </span>
           </GlassCard>

           <GlassCard className="p-4 flex flex-col hover:border-white/20 transition-colors">
             <span className="text-muted text-xs uppercase mb-1">总期间收入</span>
             <span className="font-mono font-bold text-xl text-white">
               $<AnimatedNumber value={totalIncome} decimals={0} />
             </span>
           </GlassCard>

           <GlassCard className="p-4 flex flex-col hover:border-white/20 transition-colors">
             <span className="text-muted text-xs uppercase mb-1">当前收益率</span>
             <span className="font-mono font-bold text-xl text-btc">
               <AnimatedNumber value={currentYield} decimals={2} />%
             </span>
           </GlassCard>
        </div>
      </div>

       {/* Timeline Visualization */}
       <GlassCard className="p-6">
         <h3 className="text-sm text-muted font-medium mb-6 uppercase tracking-wider">预计收入时间线</h3>
        <div className="space-y-4">
          {timelineYears.map(yr => {
            const val = annualIncome * yr;
            const pct = maxTimelineIncome > 0 ? (val / maxTimelineIncome) * 100 : 0;
            return (
              <div key={yr} className="flex flex-col gap-1">
               <div className="flex justify-between text-xs font-mono">
                   <span className="text-muted">第{yr}年</span>
                   <span className="text-white">{formatCurrency(val, true)}</span>
                 </div>
                <div className="h-2 w-full bg-dark/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500/50 to-green-400 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.max(pct, 1)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

       <p className="text-center text-xs text-muted/50 mt-8 max-w-2xl mx-auto">
         本计算器假设股息率和股价在投资期间保持不变。不考虑股息再投资、通胀、税费或标的资产价值变动。实际结果可能存在重大差异。
       </p>
    </div>
  );
}

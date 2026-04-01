import React, { useState } from 'react';
import { formatCurrency, formatNumber } from '../../lib/constants';
import { calculateCashRunway, calculateBtcCoverage } from '../../lib/calculations';
import { GlassCard } from '../ui/GlassCard';
import { AnimatedNumber } from '../ui/AnimatedNumber';

export function SustainabilityModel() {
  const [btcHoldings, setBtcHoldings] = useState<number>(500000);
  const [btcPrice, setBtcPrice] = useState<number>(85000);
  const [totalShares, setTotalShares] = useState<number>(28011111);
   const [annualDividend, setAnnualDividend] = useState<number>(11.50);
  const [usdReserves, setUsdReserves] = useState<number>(500000000);

  const cashRunway = calculateCashRunway(usdReserves, totalShares, annualDividend / 12);
  const btcCoverage = calculateBtcCoverage(btcHoldings, btcPrice, totalShares, annualDividend);
  
  const btcValue = btcHoldings * btcPrice;
  const annualObligation = totalShares * annualDividend;
  const monthlyObligation = annualObligation / 12;

  const coverageColor = btcCoverage > 10 ? 'text-green-400' : btcCoverage > 5 ? 'text-btc-gold' : 'text-red-400';
  const coverageShadow = btcCoverage > 10 ? 'rgba(34,197,94,0.3)' : btcCoverage > 5 ? 'rgba(255,179,71,0.3)' : 'rgba(239,68,68,0.3)';

  const sensitivityPrices = [50000, 75000, 100000, 150000, 200000];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
               <label htmlFor="btc-holdings" className="text-sm text-muted font-medium mb-1 block">BTC持有量</label>
              <input
                id="btc-holdings"
                type="number"
                value={btcHoldings}
                onChange={(e) => setBtcHoldings(Number(e.target.value))}
                step={1000}
                min={0}
                className="bg-dark/50 border border-white/10 rounded-lg px-4 py-2 text-white font-mono focus:border-btc focus:outline-none focus:ring-1 focus:ring-btc/50 w-full transition-colors"
              />
            </div>
            <div>
               <label htmlFor="btc-price" className="text-sm text-muted font-medium mb-1 block">BTC价格 ($)</label>
              <input
                id="btc-price"
                type="number"
                value={btcPrice}
                onChange={(e) => setBtcPrice(Number(e.target.value))}
                step={1000}
                min={0}
                className="bg-dark/50 border border-white/10 rounded-lg px-4 py-2 text-white font-mono focus:border-btc focus:outline-none focus:ring-1 focus:ring-btc/50 w-full transition-colors"
              />
            </div>
          </div>

          <div>
             <label htmlFor="total-shares" className="text-sm text-muted font-medium mb-1 block">总流通股数</label>
            <input
              id="total-shares"
              type="number"
              value={totalShares}
              onChange={(e) => setTotalShares(Number(e.target.value))}
              step={100000}
              min={0}
              className="bg-dark/50 border border-white/10 rounded-lg px-4 py-2 text-white font-mono focus:border-btc focus:outline-none focus:ring-1 focus:ring-btc/50 w-full transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
               <label htmlFor="ann-div" className="text-sm text-muted font-medium mb-1 block">年分红 ($)</label>
              <input
                id="ann-div"
                type="number"
                value={annualDividend}
                onChange={(e) => setAnnualDividend(Number(e.target.value))}
                step={0.25}
                min={0}
                className="bg-dark/50 border border-white/10 rounded-lg px-4 py-2 text-white font-mono focus:border-btc focus:outline-none focus:ring-1 focus:ring-btc/50 w-full transition-colors"
              />
            </div>
            <div>
               <label htmlFor="usd-reserves" className="text-sm text-muted font-medium mb-1 block">现金储备 ($)</label>
              <input
                id="usd-reserves"
                type="number"
                value={usdReserves}
                onChange={(e) => setUsdReserves(Number(e.target.value))}
                step={10000000}
                min={0}
                className="bg-dark/50 border border-white/10 rounded-lg px-4 py-2 text-white font-mono focus:border-btc focus:outline-none focus:ring-1 focus:ring-btc/50 w-full transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Hero Result */}
        <div className="flex flex-col justify-center items-center h-full min-h-[200px] p-6 rounded-2xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent relative overflow-hidden group">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
           <span className="text-muted text-sm uppercase tracking-widest mb-2 z-10">BTC覆盖率</span>
          <div 
            className={`text-5xl md:text-6xl font-display font-bold z-10 flex items-baseline gap-1 ${coverageColor}`}
            style={{ filter: `drop-shadow(0 0 15px ${coverageShadow})` }}
          >
            <AnimatedNumber value={btcCoverage} decimals={1} />
            <span className="text-3xl opacity-70">x</span>
          </div>
           <span className="text-xs text-muted mt-4 font-mono z-10 text-center">
             BTC价值可覆盖的分红年数
           </span>
          <div className="mt-4 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-mono text-white">
             续航: <AnimatedNumber value={cashRunway} decimals={1} /> 个月
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pt-6 mt-6">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
           <GlassCard className="p-4 flex flex-col hover:border-white/20 transition-colors">
             <span className="text-muted text-xs uppercase mb-1">BTC总价值</span>
             <span className="font-mono font-bold text-xl text-btc">
               {formatCurrency(btcValue, true)}
             </span>
           </GlassCard>
          
           <GlassCard className="p-4 flex flex-col hover:border-white/20 transition-colors">
             <span className="text-muted text-xs uppercase mb-1">年分红义务</span>
             <span className="font-mono font-bold text-xl text-white">
               {formatCurrency(annualObligation, true)}
             </span>
           </GlassCard>

           <GlassCard className="p-4 flex flex-col hover:border-white/20 transition-colors">
             <span className="text-muted text-xs uppercase mb-1">月分红义务</span>
             <span className="font-mono font-bold text-xl text-white">
               {formatCurrency(monthlyObligation, true)}
             </span>
           </GlassCard>

           <GlassCard className="p-4 flex flex-col hover:border-white/20 transition-colors">
             <span className="text-muted text-xs uppercase mb-1">现金续航</span>
             <span className="font-mono font-bold text-xl text-green-400">
               <AnimatedNumber value={cashRunway} decimals={1} /> 月
             </span>
           </GlassCard>
        </div>

        {/* BTC Price Sensitivity Table */}
        <GlassCard className="p-6">
           <h3 className="text-sm text-muted font-medium mb-4 uppercase tracking-wider">BTC价格敏感度分析</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left font-mono">
              <thead className="text-xs text-muted uppercase bg-white/5 border-b border-white/10">
               <tr>
                   <th className="px-4 py-3 rounded-tl-lg">BTC价格</th>
                   <th className="px-4 py-3">总价值</th>
                   <th className="px-4 py-3 rounded-tr-lg">覆盖率</th>
                 </tr>
              </thead>
              <tbody>
                {sensitivityPrices.map((price, idx) => {
                  const val = btcHoldings * price;
                  const cov = val / annualObligation;
                  const covColor = cov > 10 ? 'text-green-400' : cov > 5 ? 'text-btc-gold' : 'text-red-400';
                  
                  return (
                    <tr key={price} className={`border-b border-white/5 ${price === btcPrice ? 'bg-white/5' : ''}`}>
                      <td className="px-4 py-3 text-white">
                        {price === btcPrice ? '👉 ' : ''}{formatCurrency(price, true)}
                      </td>
                      <td className="px-4 py-3 text-muted">{formatCurrency(val, true)}</td>
                      <td className={`px-4 py-3 font-bold ${covColor}`}>
                        {formatNumber(cov, false).split('.')[0]}.{(cov % 1).toFixed(1).substring(2)}x
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

       <p className="text-center text-xs text-muted/50 mt-8 max-w-2xl mx-auto">
         本模型基于Strategy的公开策略分析分红可持续性。不考虑未来BTC购入、BTC借贷收益、运营费用或股息率变动。
       </p>
    </div>
  );
}

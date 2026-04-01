import React, { useState, useEffect } from 'react';
import { fetchStrcTickerData, type StrcTickerDataResponse, type StockQuote, type BtcPriceData, isMarketOpen } from '../../lib/api';
import { calculateYield, calculateVsPar, getAtmStatus, estimateAtmVolume, estimateBtcPurchased, type AtmStatus } from '../../lib/calculations';
import { formatCurrency, formatNumber, TICKERS, type TickerSymbol } from '../../lib/constants';
import { GlassCard } from '../ui/GlassCard';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { StatusBadge } from '../ui/StatusBadge';
import { Skeleton } from '../ui/Skeleton';

interface DashboardData {
    ticker: TickerSymbol;
    quote: StockQuote | null;
    btcPrice: number | null;
}

export function ATMDashboard() {
    const [strcQuote, setStrcQuote] = useState<StockQuote | null>(null);
    const [btcData, setBtcData] = useState<BtcPriceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [updatedTime, setUpdatedTime] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            try {
                const data = await fetchStrcTickerData();
                if (isMounted) {
                    const strcInfo = data.tickers.STRC;
                    const price = strcInfo.closePrice;
                    const previousClose = strcInfo.previousClose;
                    const change = price - previousClose;
                    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
                    
                    setStrcQuote({
                        symbol: 'STRC',
                        price,
                        previousClose,
                        change,
                        changePercent,
                        volume: strcInfo.latest.volume,
                        timestamp: Date.now(),
                        extendedHoursPrice: strcInfo.extendedHoursPrice,
                        extendedHoursChange: strcInfo.extendedHoursChange,
                        extendedHoursChangePercent: strcInfo.extendedHoursChangePercent,
                    });
                    
                    setBtcData({
                        price: data.btcPrice,
                        change24h: 0,
                        changePercent24h: 0,
                        lastUpdated: Date.now(),
                    });
                    
                    setUpdatedTime(data.updated);
                    setLoading(false);
                }
            } catch (err) {
                console.error("Failed to fetch dashboard data:", err);
                if (isMounted) setLoading(false);
            }
        };

        loadData();

        const interval = setInterval(loadData, 30_000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const processRow = (ticker: TickerSymbol, quote: StockQuote | null) => {
        if (!quote || !btcData) return null;
        
        const price = quote.price;
        const volume = quote.volume;
        const yld = calculateYield(ticker, price);
        const vsPar = calculateVsPar(ticker, price);
        const status = getAtmStatus(price, volume);
        const atmVolume = estimateAtmVolume(volume, price);
        const pctAtm = volume > 0 ? (atmVolume / volume) * 100 : 0;
        const estBtc = estimateBtcPurchased(atmVolume, price, btcData.price);

        return { ticker, price, yld, vsPar, status, volume, atmVolume, pctAtm, estBtc };
    };

    const strcRow = processRow('STRC', strcQuote);
    const rows = [strcRow];

    const totalVolume = rows.reduce((sum, row) => sum + (row?.volume || 0), 0);
    const totalAtmVolume = rows.reduce((sum, row) => sum + (row?.atmVolume || 0), 0);
    const totalEstBtc = rows.reduce((sum, row) => sum + (row?.estBtc || 0), 0);

    const renderRowDesktop = (ticker: TickerSymbol, row: ReturnType<typeof processRow>) => {
        if (!row || loading) {
            return (
                <tr key={ticker} className="hover:bg-white/5 transition-colors cursor-pointer">
                    <td className="py-3 px-3"><a href={`/ticker/${ticker.toLowerCase()}`} className="font-bold text-white hover:text-btc">{ticker}</a></td>
                    <td className="py-3 px-3"><StatusBadge status="loading" /></td>
                    <td className="py-3 px-3 text-right font-mono"><Skeleton width="60px" height="20px" className="ml-auto" /></td>
                    <td className="py-3 px-3 text-right font-mono text-green font-bold"><Skeleton width="60px" height="20px" className="ml-auto" /></td>
                    <td className="py-3 px-3 text-right font-mono"><Skeleton width="60px" height="20px" className="ml-auto" /></td>
                    <td className="py-3 px-3 text-right font-mono"><Skeleton width="60px" height="20px" className="ml-auto" /></td>
                    <td className="py-3 px-3 text-right font-mono"><Skeleton width="60px" height="20px" className="ml-auto" /></td>
                    <td className="py-3 px-3 text-right font-mono"><Skeleton width="40px" height="20px" className="ml-auto" /></td>
                    <td className="py-3 px-3 text-right font-mono"><Skeleton width="60px" height="20px" className="ml-auto" /></td>
                </tr>
            );
        }

        const vsParStr = row.vsPar >= 0 ? `+${formatCurrency(row.vsPar)}` : `-${formatCurrency(Math.abs(row.vsPar))}`;
        const vsParColor = row.vsPar >= 0 ? 'text-green' : 'text-red';

        return (
            <tr key={ticker} className="hover:bg-white/5 transition-colors cursor-pointer">
                <td className="py-3 px-3"><a href={`/ticker/${ticker.toLowerCase()}`} className="font-bold text-white hover:text-btc">{ticker}</a></td>
                <td className="py-3 px-3"><StatusBadge status={row.status} /></td>
                <td className="py-3 px-3 text-right font-mono"><AnimatedNumber value={row.price} prefix="$" decimals={2} /></td>
                <td className="py-3 px-3 text-right font-mono text-green font-bold"><AnimatedNumber value={row.yld} suffix="%" decimals={2} /></td>
                <td className={`py-3 px-3 text-right font-mono ${vsParColor}`}>{vsParStr}</td>
                <td className="py-3 px-3 text-right font-mono text-muted"><AnimatedNumber value={row.volume} /></td>
                <td className="py-3 px-3 text-right font-mono text-muted"><AnimatedNumber value={row.atmVolume} /></td>
                <td className="py-3 px-3 text-right font-mono text-muted">{row.pctAtm.toFixed(0)}%</td>
                <td className="py-3 px-3 text-right font-mono text-btc font-bold"><AnimatedNumber value={row.estBtc} suffix=" BTC" decimals={2} /></td>
            </tr>
        );
    };

    const renderCardMobile = (ticker: TickerSymbol, row: ReturnType<typeof processRow>) => {
        if (!row || loading) {
            return (
                <a key={ticker} href={`/ticker/${ticker.toLowerCase()}`} className="flex-shrink-0 w-[280px] bg-dark/50 rounded-lg p-3 border border-white/5 block">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <StatusBadge status="loading" />
                            <span className="font-bold">{ticker}</span>
                        </div>
                        <span className="font-mono font-bold"><Skeleton width="60px" height="20px" /></span>
                    </div>
                    <div className="flex gap-2 text-center">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex-1 bg-dark/50 rounded p-1.5">
                                <div className="text-[9px] text-muted mb-1"><Skeleton width="30px" height="10px" className="mx-auto" /></div>
                                <div className="text-xs font-bold"><Skeleton width="40px" height="14px" className="mx-auto" /></div>
                            </div>
                        ))}
                    </div>
                </a>
            );
        }

        const vsParStr = row.vsPar >= 0 ? `+${formatCurrency(row.vsPar)}` : `-${formatCurrency(Math.abs(row.vsPar))}`;
        const vsParColor = row.vsPar >= 0 ? 'text-green' : 'text-red';

        return (
            <a key={ticker} href={`/ticker/${ticker.toLowerCase()}`} className="flex-shrink-0 w-[280px] bg-dark/50 rounded-lg p-3 border border-white/5 block hover:border-white/20 transition-colors">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <StatusBadge status={row.status} />
                        <span className="font-bold">{ticker}</span>
                    </div>
                    <span className="font-mono font-bold"><AnimatedNumber value={row.price} prefix="$" decimals={2} /></span>
                </div>
                <div className="flex gap-2 text-center">
                    <div className="flex-1 bg-dark/50 rounded p-1.5">
                        <div className="text-[9px] text-muted">收益率</div>
                        <div className="text-xs font-bold text-green"><AnimatedNumber value={row.yld} suffix="%" decimals={2} /></div>
                    </div>
                    <div className="flex-1 bg-dark/50 rounded p-1.5">
                        <div className="text-[9px] text-muted">vs面值</div>
                        <div className={`text-xs font-bold ${vsParColor}`}>{vsParStr}</div>
                    </div>
                    <div className="flex-1 bg-dark/50 rounded p-1.5">
                        <div className="text-[9px] text-muted">ATM量</div>
                        <div className="text-xs font-bold text-muted"><AnimatedNumber value={row.atmVolume} /></div>
                    </div>
                    <div className="flex-1 bg-dark/50 rounded p-1.5">
                        <div className="text-[9px] text-muted">预估BTC</div>
                        <div className="text-xs font-bold text-btc"><AnimatedNumber value={row.estBtc} suffix=" BTC" decimals={2} /></div>
                    </div>
                </div>
            </a>
        );
    };

    return (
        <GlassCard className="!p-0">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                    <div className="flex items-center gap-2">
                        <h2 className="font-display font-semibold text-white">ATM 状态</h2>
                    </div>
                    {updatedTime && <span className="text-xs text-muted">数据更新: {new Date(updatedTime).toLocaleString('zh-CN')}</span>}
                </div>
                <a href="/ticker/strc" className="text-xs text-btc hover:underline">STRC行情 &rarr;</a>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full table-fixed">
                    <colgroup>
                        <col className="w-[10%]" />
                        <col className="w-[12%]" />
                        <col className="w-[12%]" />
                        <col className="w-[10%]" />
                        <col className="w-[10%]" />
                        <col className="w-[12%]" />
                        <col className="w-[12%]" />
                        <col className="w-[10%]" />
                        <col className="w-[12%]" />
                    </colgroup>
                    <thead>
                        <tr className="bg-dark/30 text-xs text-muted border-b border-white/5">
                            <th className="text-left py-2 px-3 font-medium">代码</th>
                            <th className="text-left py-2 px-3 font-medium">ATM状态</th>
                            <th className="text-right py-2 px-3 font-medium">价格</th>
                            <th className="text-right py-2 px-3 font-medium">收益率</th>
                            <th className="text-right py-2 px-3 font-medium">vs面值</th>
                            <th className="text-right py-2 px-3 font-medium">成交量</th>
                            <th className="text-right py-2 px-3 font-medium">ATM量</th>
                            <th className="text-right py-2 px-3 font-medium">%ATM</th>
                            <th className="text-right py-2 px-3 font-medium">预估BTC</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {renderRowDesktop('STRC', strcRow)}
                    </tbody>
                    <tfoot className="border-t border-white/10 bg-dark/50">
                        <tr>
                            <td className="py-3 px-3 font-bold text-muted">合计</td>
                            <td className="py-3 px-3" colSpan={4}></td>
                            <td className="py-3 px-3 text-right font-mono text-muted">{!loading ? <AnimatedNumber value={totalVolume} /> : '--'}</td>
                            <td className="py-3 px-3 text-right font-mono text-muted">{!loading ? <AnimatedNumber value={totalAtmVolume} /> : '--'}</td>
                            <td className="py-3 px-3 text-right font-mono text-muted">--</td>
                            <td className="py-3 px-3 text-right font-mono text-btc font-bold">{!loading ? <AnimatedNumber value={totalEstBtc} suffix=" BTC" decimals={2} /> : '--'}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden overflow-x-auto scrollbar-hide">
                <div className="flex gap-3 p-3 min-w-max">
                    {renderCardMobile('STRC', strcRow)}
                </div>
            </div>
        </GlassCard>
    );
}
import React, { useState, useEffect } from 'react';
import { fetchStrcSecFilings, type StrcSecFiling } from '../../lib/api';
import { formatCurrency, formatNumber } from '../../lib/constants';
import { GlassCard } from '../ui/GlassCard';
import { Skeleton } from '../ui/Skeleton';

export function HomeFilingsPreview() {
    const [filings, setFilings] = useState<StrcSecFiling[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStrcSecFilings()
            .then(data => {
                const sorted = [...data].sort((a, b) => 
                    new Date(b.filedDate).getTime() - new Date(a.filedDate).getTime()
                );
                setFilings(sorted.slice(0, 3));
            })
            .catch(err => console.error('Failed to load filings:', err))
            .finally(() => setLoading(false));
    }, []);

    const typeMap: Record<string, string> = {
        atm: 'ATM增发',
        ipo: 'IPO',
        follow_on: '后续发行',
    };

    const totalShares = filings.reduce((s, f) => s + f.sharesSold, 0);
    const totalProceeds = filings.reduce((s, f) => s + f.netProceeds, 0);
    const totalBtc = filings.reduce((s, f) => s + (f.btcPurchased ?? 0), 0);

    const formatCompactCurrency = (val: number) => {
        if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(2)}B`;
        if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
        if (val >= 1_000) return `$${Math.round(val / 1_000)}K`;
        return `$${val}`;
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }).format(new Date(dateStr));
        } catch {
            return dateStr;
        }
    };

    return (
        <GlassCard className="!p-0">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="font-display font-bold text-white">最新SEC文件</h2>
                <a href="/filings" className="text-sm text-btc hover:underline">查看全部 &rarr;</a>
            </div>

            <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-dark/30 text-xs text-muted border-b border-white/5">
                            <th className="text-left py-2 px-4 font-medium">代码</th>
                            <th className="text-left py-2 px-4 font-medium">申报日期</th>
                            <th className="text-left py-2 px-4 font-medium">类型</th>
                            <th className="text-right py-2 px-4 font-medium">售出股数</th>
                            <th className="text-right py-2 px-4 font-medium">净募集额</th>
                            <th className="text-right py-2 px-4 font-medium">BTC购入</th>
                            <th className="text-right py-2 px-4 font-medium">平均BTC价格</th>
                            <th className="text-center py-2 px-4 font-medium">链接</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-sm">
                        {loading ? (
                            [1, 2, 3].map((n) => (
                                <tr key={`skeleton-row-${n}`}>
                                    <td className="py-3 px-4"><Skeleton className="h-4 w-12" /></td>
                                    <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                                    <td className="py-3 px-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                                    <td className="py-3 px-4 flex justify-end"><Skeleton className="h-4 w-20" /></td>
                                    <td className="py-3 px-4"><div className="flex justify-end"><Skeleton className="h-4 w-16" /></div></td>
                                    <td className="py-3 px-4"><div className="flex justify-end"><Skeleton className="h-4 w-16" /></div></td>
                                    <td className="py-3 px-4"><div className="flex justify-end"><Skeleton className="h-4 w-16" /></div></td>
                                    <td className="py-3 px-4 flex justify-center"><Skeleton className="h-4 w-10" /></td>
                                </tr>
                            ))
                        ) : (
                            filings.map((f) => (
                                <tr key={f.url} className="hover:bg-white/5 transition-colors">
                                    <td className="py-3 px-4 font-bold">{f.ticker}</td>
                                    <td className="py-3 px-4 text-muted">{formatDate(f.filedDate)}</td>
                                    <td className="py-3 px-4">
                                        <span className="px-2 py-0.5 rounded-full bg-btc/10 text-btc text-xs">
                                            {typeMap[f.offeringType] || f.offeringType}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right">{formatNumber(f.sharesSold)}</td>
                                    <td className="py-3 px-4 text-right text-green">{formatCompactCurrency(f.netProceeds)}</td>
                                    <td className="py-3 px-4 text-right text-btc">
                                        {f.btcPurchased ? `~${formatNumber(f.btcPurchased)}` : '—'}
                                    </td>
                                    <td className="py-3 px-4 text-right text-muted">
                                        {f.avgBtcPrice ? formatCompactCurrency(f.avgBtcPrice) : '—'}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-btc hover:underline">SEC &rarr;</a>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    {!loading && filings.length > 0 && (
                        <tfoot className="border-t border-white/10 bg-dark/50 text-sm font-mono">
                            <tr>
                                <td className="py-3 px-4 font-bold text-muted" colSpan={3}>合计</td>
                                <td className="py-3 px-4 text-right font-bold">{formatNumber(totalShares)}</td>
                                <td className="py-3 px-4 text-right font-bold text-green">{formatCompactCurrency(totalProceeds)}</td>
                                <td className="py-3 px-4 text-right font-bold text-btc">{formatNumber(totalBtc)} BTC</td>
                                <td className="py-3 px-4" colSpan={2}></td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            {/* Mobile filings */}
            <div className="md:hidden p-4 space-y-3">
                {loading ? (
                    [1, 2, 3].map((n) => (
                        <div key={`mobile-skeleton-${n}`} className="bg-dark/50 rounded-lg p-3 border border-white/5 space-y-3">
                            <div className="flex justify-between">
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                        </div>
                    ))
                ) : (
                    filings.map((f) => (
                        <div key={f.url} className="bg-dark/50 rounded-lg p-3 border border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold">{f.ticker}</span>
                                    <span className="text-xs text-muted">{formatDate(f.filedDate)}</span>
                                </div>
                                <span className="px-2 py-0.5 rounded-full bg-btc/10 text-btc text-xs">
                                    {typeMap[f.offeringType] || f.offeringType}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span className="text-muted">股数: </span>
                                    <span className="font-mono">{formatNumber(f.sharesSold)}</span>
                                </div>
                                <div>
                                    <span className="text-muted">募集额: </span>
                                    <span className="font-mono text-green">{formatCompactCurrency(f.netProceeds)}</span>
                                </div>
                                <div>
                                    <span className="text-muted">BTC: </span>
                                    <span className="font-mono text-btc">
                                        {f.btcPurchased ? `~${formatNumber(f.btcPurchased)}` : '—'}
                                    </span>
                                </div>
                                <div>
                                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-btc hover:underline">SEC文件 &rarr;</a>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </GlassCard>
    );
}

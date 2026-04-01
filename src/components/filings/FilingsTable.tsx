import React, { useState, useEffect } from 'react';
import { fetchStrcSecFilings, type StrcSecFiling } from '../../lib/api';
import { formatCurrency, formatNumber } from '../../lib/constants';
import { GlassCard } from '../ui/GlassCard';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { Skeleton } from '../ui/Skeleton';

const formatType = (type: string) => {
    switch (type) {
        case 'atm': return 'ATM增发';
        case 'ipo': return 'IPO';
        case 'follow_on': return '后续发行';
        default: return type;
    }
};

export function FilingsTable() {
    const [data, setData] = useState<StrcSecFiling[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStrcSecFilings().then(filings => {
            const sorted = [...filings].sort((a, b) => 
                new Date(b.filedDate).getTime() - new Date(a.filedDate).getTime()
            );
            setData(sorted);
            setLoading(false);
        }).catch(err => {
            console.error('Failed to fetch STRC filings', err);
            setLoading(false);
        });
    }, []);

    const totalShares = data.reduce((sum, f) => sum + f.sharesSold, 0);
    const totalProceeds = data.reduce((sum, f) => sum + f.netProceeds, 0);
    const totalBtc = data.reduce((sum, f) => sum + (f.btcPurchased || 0), 0);
    const avgBtcPrice = totalBtc > 0 ? totalProceeds / totalBtc : 0;

    return (
        <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <GlassCard className="!p-4">
                    <div className="text-xs text-muted mb-1">总售出股数</div>
                    <div className="text-xl font-bold font-mono">
                        {loading ? <Skeleton height="28px" width="100px" /> : formatNumber(totalShares, true)}
                    </div>
                </GlassCard>
                <GlassCard className="!p-4">
                    <div className="text-xs text-muted mb-1">总募集金额</div>
                    <div className="text-xl font-bold font-mono text-green">
                        {loading ? <Skeleton height="28px" width="100px" /> : formatCurrency(totalProceeds, true)}
                    </div>
                    <div className="text-[10px] text-muted">净募集额</div>
                </GlassCard>
                <GlassCard className="!p-4">
                    <div className="text-xs text-muted mb-1">预估BTC购入</div>
                    {loading ? (
                        <Skeleton height="28px" width="100px" className="my-1" />
                    ) : (
                        <AnimatedNumber value={totalBtc} suffix=" BTC" className="text-xl font-bold font-mono text-btc" />
                    )}
                    <div className="text-[10px] text-muted">STRC募集所得</div>
                </GlassCard>
                <GlassCard className="!p-4">
                    <div className="text-xs text-muted mb-1">平均BTC成本</div>
                    <div className="text-xl font-bold font-mono">
                        {loading ? <Skeleton height="28px" width="100px" /> : formatCurrency(avgBtcPrice, true)}
                    </div>
                    <div className="text-[10px] text-muted">加权平均</div>
                </GlassCard>
            </div>

            {/* Filings Table */}
            <GlassCard className="!p-0">
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-dark/30 text-xs text-muted border-b border-white/5">
                                <th className="text-left py-2 px-4 font-medium">代码</th>
                                <th className="text-left py-2 px-4 font-medium">申报日期</th>
                                <th className="text-left py-2 px-4 font-medium">类型</th>
                                <th className="text-left py-2 px-4 font-medium">期间</th>
                                <th className="text-right py-2 px-4 font-medium">售出股数</th>
                                <th className="text-right py-2 px-4 font-medium">净募集额</th>
                                <th className="text-right py-2 px-4 font-medium">BTC购入</th>
                                <th className="text-right py-2 px-4 font-medium">平均BTC价格</th>
                                <th className="text-center py-2 px-4 font-medium">链接</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="py-8 text-center">
                                        <div className="flex justify-center space-x-2">
                                            <Skeleton width="100%" height="20px" />
                                        </div>
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-8 text-center text-muted">
                                        未找到SEC文件
                                    </td>
                                </tr>
                            ) : (
                                data.map((f) => (
                                    <tr key={`${f.ticker}-${f.filedDate}-${f.sharesSold}`} className="hover:bg-white/5 transition-colors">
                                        <td className="py-3 px-4 font-bold">{f.ticker}</td>
                                        <td className="py-3 px-4 text-muted">{f.filedDate}</td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-0.5 rounded-full bg-btc/10 text-btc text-xs">{formatType(f.offeringType)}</span>
                                        </td>
                                        <td className="py-3 px-4 text-muted">{f.period}</td>
                                        <td className="py-3 px-4 text-right">{formatNumber(f.sharesSold, true)}</td>
                                        <td className="py-3 px-4 text-right text-green">{formatCurrency(f.netProceeds, true)}</td>
                                        <td className="py-3 px-4 text-right text-btc">
                                            {f.btcPurchased !== null ? `~${f.btcPurchased.toLocaleString()}` : '—'}
                                        </td>
                                        <td className="py-3 px-4 text-right text-muted">{formatCurrency(f.avgBtcPrice, true)}</td>
                                        <td className="py-3 px-4 text-center">
                                            <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-btc hover:underline">SEC &rarr;</a>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {!loading && data.length > 0 && (
                            <tfoot className="border-t border-white/10 bg-dark/50 text-sm font-mono">
                                <tr>
                                    <td className="py-3 px-4 font-bold text-muted" colSpan={4}>合计</td>
                                    <td className="py-3 px-4 text-right font-bold">{formatNumber(totalShares, true)}</td>
                                    <td className="py-3 px-4 text-right font-bold text-green">{formatCurrency(totalProceeds, true)}</td>
                                    <td className="py-3 px-4 text-right font-bold text-btc">{totalBtc.toLocaleString()} BTC</td>
                                    <td className="py-3 px-4" colSpan={2}></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>

                {/* Mobile filings */}
                <div className="md:hidden p-4 space-y-3">
                    {loading ? (
                        <div className="bg-dark/50 rounded-lg p-3 border border-white/5 space-y-2">
                            <Skeleton height="20px" width="50%" />
                            <Skeleton height="60px" width="100%" />
                        </div>
                    ) : data.length === 0 ? (
                        <div className="text-center text-muted py-4">未找到SEC文件</div>
                    ) : (
                        data.map((f) => (
                            <div key={`${f.ticker}-${f.filedDate}-${f.sharesSold}-mobile`} className="bg-dark/50 rounded-lg p-3 border border-white/5">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold">{f.ticker}</span>
                                        <span className="text-xs text-muted">{f.filedDate}</span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full bg-btc/10 text-btc text-xs">{formatType(f.offeringType)}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                    <div><span className="text-muted">期间: </span>{f.period}</div>
                                    <div><span className="text-muted">股数: </span>{formatNumber(f.sharesSold, true)}</div>
                                    <div><span className="text-muted">募集额: </span><span className="text-green">{formatCurrency(f.netProceeds, true)}</span></div>
                                    <div><span className="text-muted">BTC: </span><span className="text-btc">{f.btcPurchased !== null ? `~${f.btcPurchased.toLocaleString()}` : '—'}</span></div>
                                    <div><span className="text-muted">价格: </span>{formatCurrency(f.avgBtcPrice, true)}</div>
                                </div>
                                <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-btc text-xs hover:underline mt-2 inline-block">SEC文件 &rarr;</a>
                            </div>
                        ))
                    )}
                </div>
            </GlassCard>
        </>
    );
}

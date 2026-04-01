import React, { useState, useEffect } from 'react';
import { fetchStrcTickerData, type StrcTickerDataResponse } from '../../lib/api';
import { GlassCard } from '../ui/GlassCard';
import { Skeleton } from '../ui/Skeleton';

export function DividendsTable() {
    const [data, setData] = useState<StrcTickerDataResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStrcTickerData()
            .then(res => {
                setData(res);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load dividends data:", err);
                setLoading(false);
            });
    }, []);

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return '—';
        // Handle timezone issues by constructing date from parts if it's ISO date string without time
        let date = new Date(dateStr);
        if (dateStr.length === 10 && dateStr.includes('-')) {
             const [y, m, d] = dateStr.split('-');
             date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        }
        return date.toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getRecoveryColor = (days: number | undefined | null) => {
        if (typeof days !== 'number') return 'text-muted';
        if (days <= 3) return 'text-green-400';
        if (days <= 7) return 'text-yellow-400';
        return 'text-red-400';
    };

    const strc = data?.tickers?.STRC;
    const currentDividend = strc?.dividends?.current;
    const historyDividends = strc?.dividends?.history || [];
    
    // Combine current and history
    const allDividends = [
        ...(currentDividend ? [currentDividend] : []),
        ...historyDividends
    ].sort((a, b) => new Date(b.exDate).getTime() - new Date(a.exDate).getTime());

    // Calculate average recovery days
    const validRecoveryDays = historyDividends.filter(d => typeof d.recoveryDays === 'number');
    const avgRecoveryDays = validRecoveryDays.length > 0 
        ? (validRecoveryDays.reduce((acc, d) => acc + d.recoveryDays, 0) / validRecoveryDays.length).toFixed(1)
        : '—';

    return (
        <>
            {/* Rate summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <GlassCard className="!p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-xs text-muted">STRC 利率</span>
                            <div className="text-2xl font-mono font-bold text-btc">
                                {loading ? <Skeleton width="80px" height="32px" /> : `${strc?.summary?.currentYield?.toFixed(2) || '0.00'}%`}
                            </div>
                            <span className="text-xs text-muted">
                                {loading ? <Skeleton width="60px" height="16px" className="mt-1" /> : `$${currentDividend?.amount?.toFixed(4) || '0.0000'}/月`}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-muted">下次除息日</span>
                            <div className="text-sm font-mono text-white mt-1">
                                {loading ? <Skeleton width="80px" height="20px" className="ml-auto" /> : formatDate(currentDividend?.exDate)}
                            </div>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="!p-4 flex flex-col justify-center">
                    <span className="text-xs text-muted">平均恢复天数</span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <div className="text-2xl font-mono font-bold text-white">
                            {loading ? <Skeleton width="60px" height="32px" /> : avgRecoveryDays}
                        </div>
                        {!loading && avgRecoveryDays !== '—' && <span className="text-sm text-muted">天</span>}
                    </div>
                </GlassCard>
            </div>

            {/* Dividends Table */}
            <GlassCard className="!p-0">
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-dark/30 text-xs text-muted border-b border-white/5">
                                <th className="text-left py-2 px-4 font-medium">代码</th>
                                <th className="text-left py-2 px-4 font-medium">除息日</th>
                                <th className="text-left py-2 px-4 font-medium">付息日</th>
                                <th className="text-right py-2 px-4 font-medium">金额</th>
                                <th className="text-center py-2 px-4 font-medium">类型</th>
                                <th className="text-right py-2 px-4 font-medium">恢复天数</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center">
                                        <div className="flex justify-center space-x-2">
                                            <Skeleton width="100%" height="20px" />
                                        </div>
                                    </td>
                                </tr>
                            ) : allDividends.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-muted">
                                        未找到分红记录
                                    </td>
                                </tr>
                            ) : (
                                allDividends.map((d) => {
                                    const isHistory = 'recoveryDays' in d;
                                    const recoveryDays = isHistory ? d.recoveryDays : null;
                                    
                                    return (
                                        <tr key={`STRC-${d.exDate}`} className="hover:bg-white/5 transition-colors">
                                            <td className="py-3 px-4 font-bold">STRC</td>
                                            <td className="py-3 px-4 text-white">{formatDate(d.exDate)}</td>
                                            <td className="py-3 px-4 text-muted">{formatDate(d.payDate)}</td>
                                            <td className="py-3 px-4 text-right text-btc-gold">${d.amount}</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="px-2 py-0.5 rounded-full bg-green/10 text-green text-xs">{d.distributionType}</span>
                                            </td>
                                            <td className={`py-3 px-4 text-right font-bold ${getRecoveryColor(recoveryDays)}`}>
                                                {typeof recoveryDays === 'number' ? `${recoveryDays} 天` : '—'}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile dividends */}
                <div className="md:hidden p-4 space-y-3">
                    {loading ? (
                        <div className="bg-dark/50 rounded-lg p-3 border border-white/5 space-y-2">
                            <Skeleton height="20px" width="50%" />
                            <Skeleton height="60px" width="100%" />
                        </div>
                    ) : allDividends.length === 0 ? (
                        <div className="text-center text-muted py-4">未找到分红记录</div>
                    ) : (
                        allDividends.map((d) => {
                            const isHistory = 'recoveryDays' in d;
                            const recoveryDays = isHistory ? d.recoveryDays : null;

                            return (
                                <div key={`STRC-${d.exDate}`} className="bg-dark/50 rounded-lg p-3 border border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">STRC</span>
                                            <span className="text-xs text-muted">除息: {formatDate(d.exDate)}</span>
                                        </div>
                                        <span className="px-2 py-0.5 rounded-full bg-green/10 text-green text-xs">{d.distributionType}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                        <div><span className="text-muted">付息日: </span>{formatDate(d.payDate)}</div>
                                        <div><span className="text-muted">金额: </span><span className="text-btc-gold">${d.amount}</span></div>
                                        <div className="col-span-2">
                                            <span className="text-muted">恢复天数: </span>
                                            <span className={`font-bold ${getRecoveryColor(recoveryDays)}`}>
                                                {typeof recoveryDays === 'number' ? `${recoveryDays} 天` : '—'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </GlassCard>
        </>
    );
}

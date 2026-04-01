import React from 'react';

type StatusType = 'active' | 'standby' | 'inactive' | 'loading';

interface StatusBadgeProps {
    status: StatusType;
    label?: string;
    className?: string;
}

export function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
    const config = {
        active: { color: 'bg-green text-green', dot: 'animate-pulse-dot bg-green', text: '活跃' },
        standby: { color: 'bg-btc-gold text-btc-gold', dot: 'bg-btc-gold', text: '待命' },
        inactive: { color: 'bg-red text-red', dot: 'bg-red', text: '停止' },
        loading: { color: 'bg-muted text-muted', dot: 'bg-muted', text: '加载中...' },
    };

    const { color, dot, text } = config[status];

    return (
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 bg-white/5 border border-white/10 ${className}`}>
            <div className={`w-2 h-2 rounded-full ${dot}`}></div>
            <span className={`text-xs font-semibold uppercase tracking-wider ${color.split(' ')[1]}`}>
                {label || text}
            </span>
        </div>
    );
}
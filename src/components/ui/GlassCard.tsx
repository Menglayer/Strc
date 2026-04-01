import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
}

export function GlassCard({ children, className = '', hover = false }: GlassCardProps) {
    const baseClasses = 'glass-card p-6 relative overflow-hidden transition-colors duration-300';
    const hoverClasses = hover ? 'hover:border-btc/30 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(247,147,26,0.1)]' : '';
    
    return (
        <div className={`${baseClasses} ${hoverClasses} ${className}`}>
            {children}
        </div>
    );
}
import React from 'react';

interface SkeletonProps {
    className?: string;
    width?: string;
    height?: string;
}

export function Skeleton({ className = '', width, height }: SkeletonProps) {
    const style: React.CSSProperties = {};
    if (width) style.width = width;
    if (height) style.height = height;

    return (
        <div 
            className={`animate-shimmer rounded-md bg-white/5 ${className}`}
            style={style}
        />
    );
}
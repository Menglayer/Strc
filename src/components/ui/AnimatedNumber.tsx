import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedNumberProps {
    value: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    className?: string;
}

export function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0, className = '' }: AnimatedNumberProps) {
    const spring = useSpring(0, { bounce: 0, duration: 1500 });
    
    useEffect(() => {
        spring.set(value);
    }, [value, spring]);

    const displayValue = useTransform(spring, (current) => {
        return `${prefix}${current.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        })}${suffix}`;
    });

    return (
        <motion.span className={className}>
            {displayValue}
        </motion.span>
    );
}
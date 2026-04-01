import { useState, useEffect } from 'react';
import { fetchStrcTickerData, type StrcTickerDataResponse, isMarketOpen } from '../../lib/api';
import { formatCurrency } from '../../lib/constants';

interface TickerItem {
    id: string;
    name: string;
    price: string | null;
    changePercent: number | null;
    dotColor: string;
    textColor: string;
    href?: string;
}

export function LiveTickerTape() {
    const [strc, setStrc] = useState<TickerItem>({ id: 'strc', name: 'STRC', price: null, changePercent: null, dotColor: 'bg-green', textColor: 'text-white', href: '/ticker/strc' });
    const [btc, setBtc] = useState<TickerItem>({ id: 'btc', name: 'BTC', price: null, changePercent: null, dotColor: 'bg-btc', textColor: 'text-btc' });
    const [afterhours, setAfterhours] = useState<TickerItem | null>(null);
    const [marketOpen, setMarketOpen] = useState(false);

    useEffect(() => {
        let isMounted = true;
        
        const fetchData = async () => {
            try {
                if (isMounted) setMarketOpen(isMarketOpen());
                
                const data = await fetchStrcTickerData();
                
                if (isMounted) {
                    const strcInfo = data.tickers.STRC;
                    
                    const price = strcInfo.closePrice;
                    const previousClose = strcInfo.previousClose;
                    const change = price - previousClose;
                    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
                    
                    setStrc(prev => ({
                        ...prev,
                        price: formatCurrency(price),
                        changePercent: changePercent,
                        dotColor: changePercent >= 0 ? 'bg-green' : 'bg-red'
                    }));
                    
                    setBtc(prev => ({
                        ...prev,
                        price: formatCurrency(data.btcPrice),
                        changePercent: null
                    }));

                    if (strcInfo.extendedHoursPrice > 0) {
                        setAfterhours({
                            id: 'afterhours',
                            name: '盘后',
                            price: formatCurrency(strcInfo.extendedHoursPrice),
                            changePercent: strcInfo.extendedHoursChangePercent,
                            dotColor: 'bg-yellow-400',
                            textColor: 'text-yellow-400'
                        });
                    } else {
                        setAfterhours(null);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch ticker data:", err);
            }
        };

        fetchData();

        const interval = setInterval(fetchData, 30_000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const marketItem: TickerItem = {
        id: 'market',
        name: '市场',
        price: marketOpen ? '开盘' : '休市',
        changePercent: null,
        dotColor: marketOpen ? 'bg-green' : 'bg-muted',
        textColor: marketOpen ? 'text-white' : 'text-muted'
    };

    const items = [strc, btc];
    if (afterhours) {
        items.push(afterhours);
    }
    items.push(marketItem);

    const renderItems = (suffix: string) =>
        items.map((item) => {
            let priceDisplay = item.price || '--';
            if (item.id === 'btc' && item.price) {
                // Formatting is handled by formatCurrency but we add standard change percent styling
            }
            
            const content = (
                <div className="flex items-center gap-2 mx-8 min-w-max">
                    <span className="relative inline-flex h-2.5 w-2.5">
                        <span className={`absolute inline-flex h-full w-full rounded-full ${item.dotColor} opacity-75 ${item.id === 'strc' ? 'animate-pulse-dot' : ''}`} />
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${item.dotColor}`} />
                    </span>
                    <span className={`font-bold text-sm ${item.id === 'btc' ? 'text-btc' : 'text-white'}`}>{item.name}</span>
                    <span className={`font-mono text-sm font-medium ${item.textColor}`}>{priceDisplay}</span>
                    {item.changePercent !== null && (
                        <span className={`font-mono text-xs ${item.changePercent >= 0 ? 'text-green' : 'text-red'}`}>
                            {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                        </span>
                    )}
                </div>
            );

            if (item.href) {
                return (
                    <a key={`${item.id}-${suffix}`} href={item.href} className="hover:opacity-80 transition-opacity">
                        {content}
                    </a>
                );
            }
            return <div key={`${item.id}-${suffix}`}>{content}</div>;
        });

    return (
        <div className="glass-card !rounded-none !border-x-0 !border-t-0 overflow-hidden">
            <div className="flex animate-ticker whitespace-nowrap py-3">
                {renderItems('a')}
                {renderItems('b')}
                {renderItems('c')}
            </div>
        </div>
    );
}
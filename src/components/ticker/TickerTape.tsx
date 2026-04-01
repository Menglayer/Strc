export function TickerTape() {
    const items = [
        { id: 'strc', name: 'STRC', price: '$99.87', dotColor: 'bg-green', textColor: 'text-white', href: '/ticker/strc' },
        { id: 'sata', name: 'SATA', price: '--', dotColor: 'bg-muted', textColor: 'text-white', href: '/ticker/sata' },
        { id: 'btc', name: 'BTC', price: '--', dotColor: 'bg-btc', textColor: 'text-btc', href: undefined },
        { id: 'market', name: 'Market', price: 'Closed', dotColor: 'bg-muted', textColor: 'text-muted', href: undefined },
    ];

    const renderItems = (suffix: string) =>
        items.map((item) => {
            const content = (
                <div key={`${item.id}-${suffix}`} className="flex items-center gap-2 mx-8 min-w-max">
                    <span className="relative inline-flex h-2.5 w-2.5">
                        <span className={`absolute inline-flex h-full w-full rounded-full ${item.dotColor} opacity-75 ${item.id === 'strc' ? 'animate-pulse-dot' : ''}`} />
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${item.dotColor}`} />
                    </span>
                    <span className={`font-bold text-sm ${item.id === 'btc' ? 'text-btc' : 'text-white'}`}>{item.name}</span>
                    <span className={`font-mono text-sm font-medium ${item.textColor}`}>{item.price}</span>
                </div>
            );

            if (item.href) {
                return (
                    <a key={`${item.id}-${suffix}`} href={item.href} className="hover:opacity-80 transition-opacity">
                        {content}
                    </a>
                );
            }
            return content;
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

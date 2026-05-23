'use client';

export default function StatsGrid({ stats }) {
    const cards = [
        { label: 'Total Devices', key: 'total', variant: 'gradient' },
        { label: 'Manufactured', key: 'manufactured', variant: 'blue' },
        { label: 'Registered', key: 'registered', variant: 'amber' },
        { label: 'Paired', key: 'paired', variant: 'green' },
    ];

    return (
        <div className="stats-grid">
            {cards.map((card) => (
                <div key={card.key} className={`stat-card ${card.variant}`}>
                    <div className="stat-label">{card.label}</div>
                    <div className="stat-value">
                        {stats ? stats[card.key] : '—'}
                    </div>
                </div>
            ))}
        </div>
    );
}

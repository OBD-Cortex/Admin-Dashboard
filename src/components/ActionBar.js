'use client';

const FILTERS = [
    { label: 'All', value: 'all' },
    { label: 'Manufactured', value: 'manufactured' },
    { label: 'Registered', value: 'registered' },
    { label: 'Paired', value: 'paired' },
];

export default function ActionBar({
    searchValue,
    onSearchChange,
    currentFilter,
    onFilterChange,
    onGenerateClick,
    onIngestClick,
}) {
    return (
        <div className="action-bar">
            {/* Search */}
            <div className="search-box">
                <svg
                    className="search-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                    type="text"
                    placeholder="Search by token or VIN…"
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            {/* Filter Group */}
            <div className="filter-group">
                {FILTERS.map((f) => (
                    <button
                        key={f.value}
                        className={`filter-btn${currentFilter === f.value ? ' active' : ''}`}
                        onClick={() => onFilterChange(f.value)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Ingest Document Button */}
            <button
                className="filter-btn"
                onClick={onIngestClick}
                style={{
                    marginLeft: 'auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-glass)',
                }}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ width: '15px', height: '15px', color: 'var(--accent-blue)' }}
                >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Ingest Document
            </button>

            {/* Generate Button */}
            <button className="generate-btn" onClick={onGenerateClick}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Generate Devices
            </button>
        </div>
    );
}

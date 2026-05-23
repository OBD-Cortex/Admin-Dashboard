'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import StatsGrid from '@/components/StatsGrid';
import ActionBar from '@/components/ActionBar';
import DeviceTable from '@/components/DeviceTable';
import GenerateModal from '@/components/GenerateModal';
import QRModal from '@/components/QRModal';
import { ToastProvider, useToast } from '@/components/Toast';

function Dashboard() {
    const router = useRouter();
    const { toast } = useToast();

    const [stats, setStats] = useState(null);
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentFilter, setCurrentFilter] = useState('all');
    const [searchValue, setSearchValue] = useState('');
    const [generateModalOpen, setGenerateModalOpen] = useState(false);
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [selectedToken, setSelectedToken] = useState(null);

    const debounceRef = useRef(null);

    // ---- Auth Check ----
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/auth');
                const data = await res.json();
                if (!data.authenticated) {
                    router.push('/login');
                }
            } catch {
                router.push('/login');
            }
        };
        checkAuth();
    }, [router]);

    // ---- Fetch Stats ----
    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch('/api/stats');
            const data = await res.json();
            setStats(data);
        } catch {
            // silent
        }
    }, []);

    // ---- Fetch Devices ----
    const fetchDevices = useCallback(
        async (search = '', filter = 'all') => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (filter && filter !== 'all') params.set('status', filter);
                if (search) params.set('search', search);

                const res = await fetch(`/api/devices?${params.toString()}`);
                const data = await res.json();
                setDevices(data.devices || []);
            } catch {
                setDevices([]);
            } finally {
                setLoading(false);
            }
        },
        []
    );

    // ---- Initial Load ----
    useEffect(() => {
        fetchStats();
        fetchDevices();
    }, [fetchStats, fetchDevices]);

    // ---- Search (debounced) ----
    const handleSearchChange = (value) => {
        setSearchValue(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchDevices(value, currentFilter);
        }, 350);
    };

    // ---- Filter Change ----
    const handleFilterChange = (filter) => {
        setCurrentFilter(filter);
        fetchDevices(searchValue, filter);
    };

    // ---- Generate Callback ----
    const handleGenerated = (data) => {
        toast(`Successfully generated ${data.generated} device${data.generated > 1 ? 's' : ''}`, 'success');
        fetchStats();
        fetchDevices(searchValue, currentFilter);

        // Auto-show QR if single device was generated
        if (data.tokens && data.tokens.length === 1) {
            setSelectedToken(data.tokens[0]);
            setQrModalOpen(true);
        }
    };

    // ---- Show QR ----
    const handleShowQR = (token) => {
        setSelectedToken(token);
        setQrModalOpen(true);
    };

    // ---- Delete Device ----
    const handleDelete = async (token) => {
        if (!confirm(`Delete device ${token}? This action cannot be undone.`)) return;

        try {
            const res = await fetch(`/api/delete?token=${encodeURIComponent(token)}`, {
                method: 'DELETE',
            });
            const data = await res.json();

            if (!res.ok) {
                toast(data.error || 'Delete failed', 'error');
                return;
            }

            toast(`Device ${token} deleted`, 'success');
            fetchStats();
            fetchDevices(searchValue, currentFilter);
        } catch {
            toast('Network error during delete', 'error');
        }
    };

    return (
        <div className="app-container">
            <Header />
            <StatsGrid stats={stats} />
            <ActionBar
                searchValue={searchValue}
                onSearchChange={handleSearchChange}
                currentFilter={currentFilter}
                onFilterChange={handleFilterChange}
                onGenerateClick={() => setGenerateModalOpen(true)}
            />
            <DeviceTable
                devices={devices}
                onShowQR={handleShowQR}
                onDelete={handleDelete}
                loading={loading}
            />
            <GenerateModal
                isOpen={generateModalOpen}
                onClose={() => setGenerateModalOpen(false)}
                onGenerated={handleGenerated}
            />
            <QRModal
                isOpen={qrModalOpen}
                onClose={() => setQrModalOpen(false)}
                token={selectedToken}
            />
        </div>
    );
}

export default function HomePage() {
    return (
        <ToastProvider>
            <Dashboard />
        </ToastProvider>
    );
}

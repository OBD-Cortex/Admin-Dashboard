'use client';

/**
 * Main Fleet Administrator Dashboard Page — Device-Identity-Mapper
 * ─────────────────────────────────────────────────────────────
 * Serves as the central state-machine and layout compiler. Coordinates
 * authentication checks, search/filter queries, modal views,
 * deletion handshakes, and user notifications.
 *
 * Maintainability Considerations:
 * 1. Debounced Searching: To prevent database indexing overload, keystroke
 *    filtering utilizes a 350ms timeout threshold before querying API routes.
 * 2. Referential Stability: Data fetching functions are memoized with `useCallback`
 *    to prevent infinite rendering loops within useEffect dependency arrays.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import StatsGrid from '@/components/StatsGrid';
import ActionBar from '@/components/ActionBar';
import DeviceTable from '@/components/DeviceTable';
import GenerateModal from '@/components/GenerateModal';
import QRModal from '@/components/QRModal';
import UploadModal from '@/components/UploadModal';
import { ToastProvider, useToast } from '@/components/Toast';

function Dashboard() {
    const router = useRouter();
    const { toast } = useToast();

    // ─────────────────────────────────────────────────────────────
    // CLIENT STATES
    // ─────────────────────────────────────────────────────────────
    const [stats, setStats] = useState(null);               // Stores total, paired, and manufacturing metrics
    const [devices, setDevices] = useState([]);             // Array of device objects matching active filters
    const [loading, setLoading] = useState(true);           // Displays skeleton table shimmers during load states
    const [currentFilter, setCurrentFilter] = useState('all'); // State filters: 'all', 'manufactured', 'registered', 'paired'
    const [searchValue, setSearchValue] = useState('');     // Raw search text entered in ActionBar input
    const [generateModalOpen, setGenerateModalOpen] = useState(false); // Controls bulk provision view
    const [qrModalOpen, setQrModalOpen] = useState(false);             // Controls print label display
    const [selectedToken, setSelectedToken] = useState(null);         // Device token currently inspected in QRModal
    const [ingestModalOpen, setIngestModalOpen] = useState(false);     // Controls document ingestion upload view
    const [ragStatus, setRagStatus] = useState('loading');             // RAG VM connectivity state: 'loading', 'connected', 'disconnected'

    // Ref container storing the active search debounce timer handle
    const debounceRef = useRef(null);

    // ─────────────────────────────────────────────────────────────
    // DATA FETCHING & SYNCHRONIZATION
    // ─────────────────────────────────────────────────────────────

    // Validate if session JWT is still active. If not, redirect to Login.
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

    // Retrieve aggregated stats for display in dashboard cards
    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch('/api/stats');
            const data = await res.json();
            setStats(data);
        } catch {
            // Fails silently to prevent console log spam on session dropouts
        }
    }, []);

    // Retrieve filtered device lists matching query boundaries
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

    // Retrieve health metrics (database and Python RAG connectivity status)
    const fetchHealth = useCallback(async () => {
        try {
            const res = await fetch('/api/health');
            const data = await res.json();
            setRagStatus(data.rag || 'disconnected');
        } catch {
            setRagStatus('disconnected');
        }
    }, []);

    // Initial boot load hook
    useEffect(() => {
        fetchStats();
        fetchDevices();
        fetchHealth();

        // Check RAG connection status periodically every 30 seconds
        const healthPoll = setInterval(fetchHealth, 30000);
        return () => clearInterval(healthPoll);
    }, [fetchStats, fetchDevices, fetchHealth]);

    // ─────────────────────────────────────────────────────────────
    // COMPONENT INTERACTION HANDLERS
    // ─────────────────────────────────────────────────────────────

    // Debounces typing keys. Waits 350ms of silence before calling the backend.
    const handleSearchChange = (value) => {
        setSearchValue(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchDevices(value, currentFilter);
        }, 350);
    };

    // Filter toggle handler (All, Manufactured, Registered, Paired)
    const handleFilterChange = (filter) => {
        setCurrentFilter(filter);
        fetchDevices(searchValue, filter);
    };

    // Callback fired when bulk creation completes successfully
    const handleGenerated = (data) => {
        toast(`Successfully generated ${data.generated} device${data.generated > 1 ? 's' : ''}`, 'success');
        fetchStats();
        fetchDevices(searchValue, currentFilter);

        // Auto-show QR viewer modal if only a single device was provisioned
        if (data.tokens && data.tokens.length === 1) {
            setSelectedToken(data.tokens[0]);
            setQrModalOpen(true);
        }
    };

    // Inspectors hook to display print labels
    const handleShowQR = (token) => {
        setSelectedToken(token);
        setQrModalOpen(true);
    };

    // Deletes a device registration from database. Refuses deletion if device is paired.
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
            <Header ragStatus={ragStatus} />
            <StatsGrid stats={stats} />
            <ActionBar
                searchValue={searchValue}
                onSearchChange={handleSearchChange}
                currentFilter={currentFilter}
                onFilterChange={handleFilterChange}
                onGenerateClick={() => setGenerateModalOpen(true)}
                onIngestClick={() => setIngestModalOpen(true)}
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
            <UploadModal
                isOpen={ingestModalOpen}
                onClose={() => setIngestModalOpen(false)}
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

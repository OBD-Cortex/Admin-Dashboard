'use client';

import { useRouter } from 'next/navigation';
import { logout } from '@/app/actions';

export default function Header({ ragStatus }) {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (err) {
            // proceed regardless
        }
        router.push('/login');
    };

    return (
        <header className="header">
            <div className="header-brand">
                <div className="header-logo">C</div>
                <h1 className="header-title">
                    <span className="gradient-text">OBD-Cortex</span> Admin
                </h1>
                <span className="header-badge">Manufacturer Dashboard</span>
                
                <span 
                    className={`status-badge ${
                        ragStatus === 'connected' ? 'paired' : 
                        ragStatus === 'disconnected' ? 'failed' : 
                        ragStatus === 'not_configured' ? 'manufactured' : 'registered'
                    }`} 
                    style={{ 
                        fontSize: '11px', 
                        padding: '4px 10px', 
                        marginLeft: '12px' 
                    }}
                    title={
                        ragStatus === 'connected' ? 'FastAPI Droplet VM is online.' : 
                        ragStatus === 'disconnected' ? 'FastAPI Droplet VM is offline.' : 
                        ragStatus === 'not_configured' ? 'Droplet URL is not configured.' : 'Checking status...'
                    }
                >
                    <span className="dot"></span>
                    RAG: {
                        ragStatus === 'connected' ? 'Connected' : 
                        ragStatus === 'disconnected' ? 'Offline' : 
                        ragStatus === 'not_configured' ? 'Unconfigured' : 'Checking...'
                    }
                </span>
            </div>

            <div className="header-right">
                <button
                    className="icon-btn"
                    onClick={handleLogout}
                    title="Sign out"
                    aria-label="Sign out"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                </button>
            </div>
        </header>
    );
}

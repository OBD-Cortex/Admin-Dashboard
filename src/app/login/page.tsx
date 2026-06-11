'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/app/actions';

export default function LoginPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await login(password);

            if (res.error) {
                setError(res.error || 'Authentication failed');
                setLoading(false);
                return;
            }

            router.push('/');
        } catch (err) {
            setError('Network error. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-black p-4 font-mono">
            {/* Ambient monochrome blur backdrops */}
            <div className="absolute top-[-20%] left-[-20%] w-[550px] h-[550px] bg-neutral-900/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[550px] h-[550px] bg-neutral-900/10 rounded-full blur-[140px] pointer-events-none" />

            <div className="w-full max-w-sm border border-neutral-900 bg-neutral-950 p-6 relative z-10 shadow-2xl">
                <div className="mb-6 text-center">
                    <h2 className="text-xs font-bold tracking-widest text-white uppercase mb-1">OBD-CORTEX SECURE GATEWAY</h2>
                    <p className="text-[9px] text-neutral-600 uppercase">
                        PROVIDE PASSWORD KEY TO UNLOCK Telemetry Control Center.
                    </p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    {error && (
                        <div className="border border-neutral-900 bg-black/60 px-3 py-2.5 text-[9px] text-neutral-400 font-bold text-center uppercase">
                            ERROR: {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="auth-pass" className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider">
                            AUTHENTICATION PASSWORD
                        </label>
                        <input
                            id="auth-pass"
                            className="w-full h-10 px-3 py-2 text-center text-xs border border-neutral-900 bg-neutral-950 placeholder:text-neutral-700 focus:outline-none focus:border-neutral-700 transition-all font-mono tracking-widest text-white"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoFocus
                            required
                        />
                    </div>

                    <button
                        className="w-full h-10 text-[10px] font-bold cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground border border-neutral-800 transition-colors uppercase tracking-widest select-none flex items-center justify-center gap-1.5"
                        type="submit"
                        disabled={loading || !password}
                    >
                        {loading ? (
                            <>
                                <svg className="h-3.5 w-3.5 animate-spin text-primary-foreground" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>AUTHENTICATING...</span>
                            </>
                        ) : (
                            <span>LOG IN</span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

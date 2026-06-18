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
        <div className="relative flex min-h-screen items-center justify-center warm-bg p-4 font-sans">
            <div className="w-full max-w-sm border border-border bg-card p-8 relative z-10 shadow-xl rounded-2xl">
                <div className="mb-6 text-center">
                    <h2 className="text-2xl font-bold font-serif tracking-tight text-foreground mb-1.5">OBD-Cortex</h2>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    {error && (
                        <div className="border border-destructive/40 bg-[#191919] px-4 py-3 text-xs text-[#FAF8F5] rounded-md text-center font-medium">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="auth-pass" className="block text-[10px] font-bold text-muted-foreground tracking-wider">
                            Password
                        </label>
                        <input
                            id="auth-pass"
                            className="w-full h-11 px-4 py-2 text-center text-sm border border-border bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#223A5E] focus:border-[#223A5E] transition-all rounded-md tracking-widest text-foreground font-sans"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoFocus
                            required
                        />
                    </div>

                    <button
                        className="w-full h-11 text-xs font-bold cursor-pointer bg-[#223A5E] hover:bg-[#223A5E]/90 disabled:opacity-50 text-[#FAF8F5] transition-all rounded-md tracking-widest select-none flex items-center justify-center gap-1.5 font-sans"
                        type="submit"
                        disabled={loading || !password}
                    >
                        {loading ? (
                            <>
                                <svg className="h-3.5 w-3.5 animate-spin text-[#FAF8F5]" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>Authenticating...</span>
                            </>
                        ) : (
                            <span>Login</span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

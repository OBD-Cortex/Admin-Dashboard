'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/app/actions';

export default function LoginPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
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
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">C</div>
                <h1 className="login-title">Admin Access</h1>
                <p className="login-subtitle">Enter your admin password to continue</p>

                <form className="login-form" onSubmit={handleSubmit}>
                    {error && <div className="login-error">{error}</div>}

                    <input
                        className="login-input"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoFocus
                        required
                    />

                    <button
                        className="login-submit"
                        type="submit"
                        disabled={loading || !password}
                    >
                        {loading ? 'Authenticating…' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { KeyRound, Loader2 } from 'lucide-react';

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
        <div className="relative flex min-h-screen items-center justify-center bg-background p-4 overflow-hidden">
            {/* Ambient purple blur backdrops */}
            <div className="absolute top-[-20%] left-[-20%] w-[550px] h-[550px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[550px] h-[550px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />

            <Card className="w-full max-w-sm border border-border bg-card shadow-2xl rounded-lg relative z-10">
                <CardHeader className="space-y-1.5 text-center pb-4 pt-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary border border-border/60 mx-auto mb-3 shadow-inner">
                        <KeyRound className="h-4.5 w-4.5 text-foreground" />
                    </div>
                    <CardTitle className="text-sm font-semibold tracking-tight text-foreground">Manufacturer Admin Gate</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                        Enter passcode to unlock the diagnostic control console.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pb-6">
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {error && (
                            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-[11px] text-destructive font-medium text-center font-mono">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <input
                                className="w-full h-10 px-3 py-2 text-center text-sm rounded-lg border border-border bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 font-mono tracking-widest text-foreground transition-all duration-200"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoFocus
                                required
                            />
                        </div>

                        <Button
                            className="w-full h-10 text-xs font-semibold cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground border border-border shadow-sm transition-all duration-200 rounded-lg"
                            type="submit"
                            disabled={loading || !password}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                    Unlocking...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

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
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto mb-2">
                        <KeyRound className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl font-bold tracking-tight">Admin Gate</CardTitle>
                    <CardDescription>
                        Enter your manufacturer passcode to unlock the diagnostic console.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {error && (
                            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <input
                                className="w-full px-3 py-2 text-center text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoFocus
                                required
                            />
                        </div>

                        <Button
                            className="w-full font-semibold"
                            type="submit"
                            disabled={loading || !password}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

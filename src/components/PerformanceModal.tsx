'use client';

import React, { useState } from 'react';

interface TestResult {
    service: string;
    targetUrl: string;
    status: string;
    latencyMs: number | null;
}

interface PerformanceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PerformanceModal({ isOpen, onClose }: PerformanceModalProps) {
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<TestResult[] | null>(null);
    const [lastRun, setLastRun] = useState<string | null>(null);

    if (!isOpen) return null;

    const runTests = async () => {
        setIsRunning(true);
        setResults(null);
        try {
            const res = await fetch('/api/performance');
            if (res.ok) {
                const data = await res.json();
                setResults(data.results);
                setLastRun(new Date(data.timestamp).toLocaleTimeString());
            } else {
                console.error("Performance test failed:", res.status);
            }
        } catch (e) {
            console.error("Error running performance tests:", e);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-card border border-border shadow-lg rounded-xl overflow-hidden font-sans">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold tracking-tight">System Performance Tests</h2>
                            <p className="text-xs text-muted-foreground">Measure response latency to microservices</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Controls */}
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                            {lastRun ? `Last test run at ${lastRun}` : "Click to initiate benchmark"}
                        </p>
                        <button
                            onClick={runTests}
                            disabled={isRunning}
                            className={`inline-flex h-9 items-center justify-center gap-2 rounded-md px-4 text-xs font-bold transition-all shadow-sm
                                ${isRunning ? 'bg-muted text-muted-foreground cursor-wait' : 'bg-[#223A5E] text-[#FAF8F5] hover:bg-[#223A5E]/90'}`}
                        >
                            {isRunning ? (
                                <>
                                    <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Running...
                                </>
                            ) : (
                                <>
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Run Benchmark
                                </>
                            )}
                        </button>
                    </div>

                    {/* Results Table */}
                    <div className="border border-border rounded-lg overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-3">Microservice</th>
                                    <th className="px-4 py-3">Endpoint URL</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Latency (ms)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-card">
                                {results ? (
                                    results.map((res, idx) => (
                                        <tr key={idx} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-4 py-3 font-medium">{res.service}</td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground font-mono truncate max-w-[200px]" title={res.targetUrl}>
                                                {res.targetUrl}
                                            </td>
                                            <td className="px-4 py-3">
                                                {res.status === 'connected' ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-600">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2 py-1 text-[10px] font-bold text-rose-600">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                                                        {res.status}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-bold">
                                                {res.latencyMs !== null ? (
                                                    <span className={res.latencyMs < 100 ? "text-emerald-600" : res.latencyMs < 500 ? "text-amber-500" : "text-rose-500"}>
                                                        {res.latencyMs} ms
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : isRunning ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-xs text-muted-foreground">
                                            Awaiting response from services...
                                        </td>
                                    </tr>
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-xs text-muted-foreground">
                                            No test results available. Click 'Run Benchmark' to start.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

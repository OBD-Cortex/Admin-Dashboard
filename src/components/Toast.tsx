'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
    removing: boolean;
}

interface ToastContextType {
    toast: (message: string, type?: 'success' | 'error' | 'info') => number;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const timersRef = useRef<{ [key: number]: NodeJS.Timeout }>({});
    const toastIdRef = useRef(0);

    const removeToast = useCallback((id: number) => {
        setToasts((prev) =>
            prev.map((t) => (t.id === id ? { ...t, removing: true } : t))
        );
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 300);
    }, []);

    const toast = useCallback(
        (message: string, type: 'success' | 'error' | 'info' = 'success') => {
            const id = ++toastIdRef.current;
            setToasts((prev) => [...prev, { id, message, type, removing: false }]);

            timersRef.current[id] = setTimeout(() => {
                removeToast(id);
                delete timersRef.current[id];
            }, 3500);

            return id;
        },
        [removeToast]
    );

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
                {toasts.map((t) => {
                    const isSuccess = t.type === 'success';
                    const isError = t.type === 'error';
                    return (
                        <div
                            key={t.id}
                            className={cn(
                                "flex items-start gap-3 p-4 rounded-2xl border bg-[#191919] text-[#FAF8F5] shadow-xl transition-all duration-300 pointer-events-auto",
                                isSuccess && "border-emerald-600/35",
                                isError && "border-rose-600/35",
                                !isSuccess && !isError && "border-blue-600/35",
                                t.removing ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"
                            )}
                        >
                            {isSuccess && (
                                <svg className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                            {isError && (
                                <svg className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            )}
                            {!isSuccess && !isError && (
                                <svg className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                            
                            <div className="flex-1 text-xs font-sans font-semibold leading-normal">
                                {t.message}
                            </div>
                            
                            <button
                                onClick={() => removeToast(t.id)}
                                className="text-muted-foreground hover:text-[#FAF8F5] shrink-0 rounded-lg p-0.5 transition-colors cursor-pointer"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

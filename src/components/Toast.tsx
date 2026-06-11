'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

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

let toastIdCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const timersRef = useRef<{ [key: number]: NodeJS.Timeout }>({});

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
            const id = ++toastIdCounter;
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
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
                {toasts.map((t) => {
                    const isSuccess = t.type === 'success';
                    const isError = t.type === 'error';
                    return (
                        <div
                            key={t.id}
                            className={cn(
                                "flex items-start gap-3 p-4 rounded-lg border bg-card text-card-foreground shadow-lg transition-all duration-300 pointer-events-auto",
                                t.removing ? "translate-x-full opacity-0" : "translate-x-0 opacity-100",
                                isSuccess && "border-green-500/30 bg-green-500/5",
                                isError && "border-red-500/30 bg-red-500/5"
                            )}
                        >
                            {isSuccess && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />}
                            {isError && <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />}
                            {!isSuccess && !isError && <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />}
                            
                            <div className="flex-1 text-sm font-medium leading-normal">
                                {t.message}
                            </div>
                            
                            <button
                                onClick={() => removeToast(t.id)}
                                className="text-muted-foreground hover:text-foreground shrink-0 rounded-md p-0.5 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

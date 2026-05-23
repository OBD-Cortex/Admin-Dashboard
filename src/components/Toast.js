'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

let toastIdCounter = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timersRef = useRef({});

    const removeToast = useCallback((id) => {
        // Mark as removing for exit animation
        setToasts((prev) =>
            prev.map((t) => (t.id === id ? { ...t, removing: true } : t))
        );
        // Remove from DOM after animation completes
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 300);
    }, []);

    const toast = useCallback(
        (message, type = 'success') => {
            const id = ++toastIdCounter;
            setToasts((prev) => [...prev, { id, message, type, removing: false }]);

            // Auto-dismiss after 3.5s
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
            <div className="toast-container">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`toast ${t.type}${t.removing ? ' removing' : ''}`}
                    >
                        <span className="toast-dot" />
                        {t.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

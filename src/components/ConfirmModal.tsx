'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'primary',
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm font-sans">
            <div className="w-full max-w-sm border border-border bg-card p-6 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-150">
                <div className="mb-5">
                    <h3 className="text-base font-bold font-serif tracking-tight text-foreground mb-1.5">
                        {title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                        {message}
                    </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-8 border border-border bg-background hover:bg-muted px-4 text-[10px] font-bold text-foreground transition-colors cursor-pointer select-none rounded-xl"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={cn(
                            "h-8 px-4 text-[10px] font-bold text-primary-foreground transition-all cursor-pointer select-none rounded-xl",
                            variant === 'danger' && "bg-destructive hover:opacity-90",
                            variant === 'warning' && "bg-amber-600 hover:opacity-90 text-white",
                            variant === 'primary' && "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                        )}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

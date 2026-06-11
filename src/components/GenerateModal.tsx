'use client';

import React, { useState, useEffect } from 'react';
import { generateDevices } from '@/app/actions';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface GenerateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerated: (data: any) => void;
}

export default function GenerateModal({ isOpen, onClose, onGenerated }: GenerateModalProps) {
    const [count, setCount] = useState<number>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setCount(1);
            setError('');
            setLoading(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await generateDevices(count);

            if (res.error) {
                setError(res.error);
                setLoading(false);
                return;
            }

            onGenerated(res.data);
            onClose();
        } catch (err) {
            setError('Network error. Please try again.');
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !loading && !open && onClose()}>
            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                    <DialogTitle>Provision New Devices</DialogTitle>
                    <DialogDescription>
                        Generate new device tokens. Each device receives a unique cryptographic token for pairing with the mobile application.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="device-count" className="text-sm font-semibold text-foreground">
                            Number of Devices
                        </label>
                        <input
                            id="device-count"
                            type="number"
                            min="1"
                            max="50"
                            value={count}
                            onChange={(e) => setCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                            className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            required
                        />
                        <p className="text-[11px] text-muted-foreground">
                            Each device will receive a unique token (e.g. OBD-XKFM-R4PB). Maximum 50 devices per batch.
                        </p>
                    </div>

                    {error && (
                        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || count < 1 || count > 50}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Generate {count} Device{count > 1 ? 's' : ''}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

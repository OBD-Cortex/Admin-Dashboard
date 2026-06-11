'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Smartphone } from 'lucide-react';

interface QRModalProps {
    isOpen: boolean;
    onClose: () => void;
    token: string | null;
}

export default function QRModal({ isOpen, onClose, token }: QRModalProps) {
    if (!token) return null;

    const pngUrl = `/api/qr?format=png&token=${encodeURIComponent(token)}`;
    const pngDownload = `/api/qr?format=png&token=${encodeURIComponent(token)}&download=1`;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[360px]">
                <DialogHeader className="text-center sm:text-center">
                    <DialogTitle>Pairing QR Code</DialogTitle>
                    <DialogDescription>
                        Scan this QR code with the OBD-Cortex mobile application to pair this hardware node.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center p-2 space-y-4">
                    {/* QR Frame */}
                    <div className="rounded-lg border bg-white p-4 shadow-inner">
                        <img
                            src={pngUrl}
                            alt={`QR code for ${token}`}
                            width={200}
                            height={200}
                            className="bg-white"
                        />
                    </div>

                    <div className="flex flex-col items-center gap-1.5 text-center">
                        <div className="font-mono text-sm font-bold bg-muted px-2.5 py-1 rounded select-all border">
                            {token}
                        </div>
                        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Smartphone className="h-3.5 w-3.5" />
                            Scan using the pairing scanner in settings
                        </p>
                    </div>

                    {/* Download option */}
                    <Button asChild variant="outline" className="w-full text-xs gap-2">
                        <a href={pngDownload} download>
                            <Download className="h-4 w-4" />
                            Download Label (PNG)
                        </a>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

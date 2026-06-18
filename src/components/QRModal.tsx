'use client';

import React from 'react';

interface QRModalProps {
    isOpen: boolean;
    onClose: () => void;
    token: string | null;
}

export default function QRModal({ isOpen, onClose, token }: QRModalProps) {
    const [isDownloading, setIsDownloading] = React.useState(false);

    if (!isOpen || !token) return null;

    const uppercaseToken = token.toUpperCase();
    const pngUrl = `/api/qr?format=png&token=${encodeURIComponent(uppercaseToken)}`;
    const pngDownload = `/api/qr?format=png&token=${encodeURIComponent(uppercaseToken)}&download=1`;

    const handleDownload = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (isDownloading) return;
        setIsDownloading(true);

        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error('Failed to load QR code image'));
                img.src = pngUrl;
            });

            const qrSize = 300;
            const canvasWidth = qrSize;
            const canvasHeight = qrSize + 60;

            const canvas = document.createElement('canvas');
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Canvas 2D context not available');
            }

            // Draw white background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            // Draw QR code image
            ctx.drawImage(img, 0, 0, qrSize, qrSize);

            // Draw text label below QR code
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 13px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(uppercaseToken, canvasWidth / 2, qrSize + 30);

            // Trigger file download
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `${uppercaseToken}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Failed to generate PNG label:', error);
            // Fallback download
            const fallbackLink = document.createElement('a');
            fallbackLink.href = pngDownload;
            fallbackLink.download = `${uppercaseToken}.png`;
            document.body.appendChild(fallbackLink);
            fallbackLink.click();
            document.body.removeChild(fallbackLink);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm font-sans">
            <div className="w-full max-w-[340px] border border-border bg-card p-6 shadow-2xl rounded-2xl">
                <div className="text-center mb-4">
                    <h3 className="text-base font-bold font-serif tracking-tight text-foreground mb-1">Pairing Gateway</h3>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Scan the label code via the mobile pairing configuration panel.
                    </p>
                </div>

                <div className="flex flex-col items-center justify-center p-2 space-y-4">
                    {/* QR Frame */}
                    <div className="border border-border bg-background p-3 shadow-inner rounded-xl">
                        <img
                            src={pngUrl}
                            alt={`QR code for ${uppercaseToken}`}
                            width={180}
                            height={180}
                            className="bg-white block"
                        />
                    </div>

                    <div className="flex flex-col items-center gap-1.5 w-full text-center">
                        <div className="font-mono text-xs font-bold border border-border bg-background px-3 py-2 text-foreground select-all w-full truncate text-center rounded-xl">
                            {uppercaseToken}
                        </div>
                        <p className="flex items-center justify-center gap-1 text-[9px] text-muted-foreground">
                            <svg className="h-3.5 w-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                                <line x1="12" y1="18" x2="12.01" y2="18" />
                            </svg>
                            <span>Scan using cell scanner</span>
                        </p>
                    </div>

                    {/* Download option */}
                    <button 
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="inline-flex h-9 items-center justify-center gap-1.5 bg-secondary hover:bg-secondary/90 text-secondary-foreground disabled:opacity-50 px-3 text-[10px] font-sans font-bold transition-all cursor-pointer select-none w-full rounded-xl"
                    >
                        <svg className="h-3.5 w-3.5 text-secondary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        <span>{isDownloading ? 'Generating...' : 'Download PNG Label'}</span>
                    </button>

                    <button
                        onClick={onClose}
                        className="h-9 border border-border bg-background hover:bg-muted px-3 text-[10px] font-sans font-bold text-foreground transition-colors cursor-pointer select-none w-full rounded-xl"
                    >
                        Close Window
                    </button>
                </div>
            </div>
        </div>
    );
}

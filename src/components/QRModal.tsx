'use client';

import React from 'react';

interface QRModalProps {
    isOpen: boolean;
    onClose: () => void;
    token: string | null;
}

export default function QRModal({ isOpen, onClose, token }: QRModalProps) {
    if (!isOpen || !token) return null;

    const pngUrl = `/api/qr?format=png&token=${encodeURIComponent(token)}`;
    const pngDownload = `/api/qr?format=png&token=${encodeURIComponent(token)}&download=1`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono">
            <div className="w-full max-w-[340px] border border-neutral-900 bg-black p-6 shadow-2xl">
                <div className="text-center mb-4">
                    <h3 className="text-xs font-bold tracking-widest text-white uppercase mb-1">PAIRING GATEWAY</h3>
                    <p className="text-[10px] text-neutral-500 uppercase leading-relaxed">
                        Scan the label code via the mobile pairing configuration panel.
                    </p>
                </div>

                <div className="flex flex-col items-center justify-center p-2 space-y-4">
                    {/* QR Frame */}
                    <div className="border border-neutral-900 bg-white p-3 shadow-inner">
                        <img
                            src={pngUrl}
                            alt={`QR code for ${token}`}
                            width={180}
                            height={180}
                            className="bg-white block"
                        />
                    </div>

                    <div className="flex flex-col items-center gap-1.5 w-full text-center">
                        <div className="font-mono text-xs font-bold border border-neutral-900 bg-neutral-950 px-3 py-1 text-white select-all w-full truncate text-center">
                            {token}
                        </div>
                        <p className="flex items-center justify-center gap-1 text-[9px] text-neutral-500 uppercase">
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                                <line x1="12" y1="18" x2="12.01" y2="18" />
                            </svg>
                            <span>SCAN USING CELL SCANNER</span>
                        </p>
                    </div>

                    {/* Download option */}
                    <a 
                        href={pngDownload} 
                        download
                        className="inline-flex h-8 items-center justify-center gap-1.5 border border-neutral-850 bg-neutral-950 hover:bg-neutral-900 px-3 text-[10px] font-bold uppercase text-white transition-colors cursor-pointer select-none w-full"
                    >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        <span>DOWNLOAD PNG LABEL</span>
                    </a>

                    <button
                        onClick={onClose}
                        className="h-8 border border-neutral-850 bg-neutral-950 hover:bg-neutral-900 px-3 text-[10px] font-bold uppercase text-neutral-400 transition-colors cursor-pointer select-none w-full"
                    >
                        CLOSE WINDOW
                    </button>
                </div>
            </div>
        </div>
    );
}

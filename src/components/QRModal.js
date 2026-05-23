'use client';

export default function QRModal({ isOpen, onClose, token }) {
    if (!token) return null;

    const pngUrl = `/api/qr?format=png&token=${encodeURIComponent(token)}`;
    const svgUrl = `/api/qr?format=svg&token=${encodeURIComponent(token)}`;
    const pngDownload = `/api/qr?format=png&token=${encodeURIComponent(token)}&download=1`;
    const svgDownload = `/api/qr?format=svg&token=${encodeURIComponent(token)}&download=1`;

    return (
        <div className={`modal-overlay${isOpen ? ' active' : ''}`} onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose} aria-label="Close">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                <div className="qr-preview">
                    <div className="qr-image-wrap">
                        <img
                            src={pngUrl}
                            alt={`QR code for ${token}`}
                            width={200}
                            height={200}
                        />
                    </div>

                    <div className="qr-token">{token}</div>
                    <div className="qr-subtitle">Scan with OBD-Cortex App</div>

                    <div className="qr-actions">
                        <a className="qr-download-btn" href={pngDownload} download>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            PNG Label
                        </a>
                        <a className="qr-download-btn" href={svgDownload} download>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            SVG Vector
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

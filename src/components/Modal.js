'use client';

/**
 * Reusable Modal Wrapper Component
 */
export default function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = '400px', disableClose = false }) {
    if (!isOpen) return null;

    return (
        <div className={`modal-overlay active`} onClick={() => !disableClose && onClose()}>
            <div className="modal-content" style={{ maxWidth }} onClick={(e) => e.stopPropagation()}>
                <button 
                    className="modal-close" 
                    onClick={onClose} 
                    aria-label="Close"
                    disabled={disableClose}
                    style={{ opacity: disableClose ? 0.3 : 1 }}
                >
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

                {title && <h2 className="modal-title">{title}</h2>}
                {subtitle && <p className="modal-subtitle">{subtitle}</p>}

                {children}
            </div>
        </div>
    );
}

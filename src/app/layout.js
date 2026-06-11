import './globals.css';
import { ToastProvider } from '@/components/Toast';

export const metadata = {
    title: 'OBD-Cortex Admin',
    description: 'OBD-Cortex Manufacturer Admin Dashboard — Provision and manage OBD devices',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" style={{ colorScheme: 'dark' }}>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;500&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>
                <ToastProvider>{children}</ToastProvider>
            </body>
        </html>
    );
}

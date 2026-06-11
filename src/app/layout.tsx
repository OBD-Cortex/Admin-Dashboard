import './globals.css';
import { Inter } from 'next/font/google';
import { ToastProvider } from '@/components/Toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata = {
    title: 'OBD-Cortex Admin',
    description: 'OBD-Cortex Manufacturer Admin Dashboard — Provision and manage OBD devices',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${inter.variable} dark`}>
            <body className="min-h-screen bg-background font-sans antialiased">
                <ToastProvider>{children}</ToastProvider>
            </body>
        </html>
    );
}

import './globals.css';
import { Inter, Outfit } from 'next/font/google';
import { ToastProvider } from '@/components/Toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-title',
});

export const metadata = {
    title: 'OBD-Cortex Admin',
    description: 'OBD-Cortex Manufacturer Admin Dashboard — Provision and manage OBD devices',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${inter.variable} ${outfit.variable} dark`}>
            <body className="min-h-screen bg-background font-sans antialiased">
                <ToastProvider>{children}</ToastProvider>
            </body>
        </html>
    );
}

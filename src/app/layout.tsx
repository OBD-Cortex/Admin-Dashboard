import './globals.css';
import { Lora, Plus_Jakarta_Sans } from 'next/font/google';
import { ToastProvider } from '@/components/Toast';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
});

export const metadata = {
    title: 'OBD-Cortex Admin',
    description: 'OBD-Cortex Manufacturer Admin Dashboard — Provision and manage OBD devices',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${plusJakartaSans.variable} ${lora.variable}`}>
            <body className="min-h-screen bg-background font-sans antialiased">
                <ToastProvider>{children}</ToastProvider>
            </body>
        </html>
    );
}

import './globals.css';
import { Lato } from 'next/font/google';
import { ToastProvider } from '@/components/Toast';

const lato = Lato({
  subsets: ['latin'],
  weight: ['100', '300', '400', '700', '900'],
  variable: '--font-sans',
});

export const metadata = {
    title: 'OBD-Cortex Admin',
    description: 'OBD-Cortex Manufacturer Admin Dashboard — Provision and manage OBD devices',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${lato.variable} dark`}>
            <body className="min-h-screen bg-background font-sans antialiased">
                <ToastProvider>{children}</ToastProvider>
            </body>
        </html>
    );
}

import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FestiveBackground from '@/components/FestiveBackground';

export const metadata: Metadata = {
  title: 'TGPCET Garba Night – Digital Gate Pass & Entry Management System',
  description:
    'Official Digital Gate Pass, Payment Verification, and High-Speed QR Entry Management Platform for TGPCET Garba Night & Dandiya Mahotsav.',
  keywords: [
    'TGPCET',
    'Garba Night',
    'Dandiya',
    'Navratri',
    'Digital Gate Pass',
    'Entry Management',
    'Nagpur College Festival',
  ],
  authors: [{ name: 'TGPCET Cultural Committee' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/payqr.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0717',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-screen flex flex-col bg-[#0b0717] text-slate-100 antialiased selection:bg-amber-500 selection:text-purple-950">
        <AuthProvider>
          <ToastProvider>
            <FestiveBackground />
            <Navbar />
            <main className="flex-1 relative z-10">{children}</main>
            <Footer />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

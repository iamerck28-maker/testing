import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono } from 'next/font/google';
import ServiceWorkerRegistration from '@/components/pwa/ServiceWorkerRegistration';
import './globals.css';

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-ibm-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CryptoBro - Crypto Trading Scanner',
  description:
    'Aplikasi analisa trading crypto dengan scanner canggih, deteksi pola, dan sinyal real-time untuk scalping, intraday, dan swing trading.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'CryptoBro',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#b6ff00',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${ibmPlexMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg-primary text-text-primary">
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

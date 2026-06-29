import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono } from 'next/font/google';
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
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0b0e11',
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
      </body>
    </html>
  );
}

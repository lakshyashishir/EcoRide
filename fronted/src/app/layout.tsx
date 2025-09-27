import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import Providers from '@/components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'EcoRide - Sustainable Transit Rewards',
  description: 'Earn GREEN tokens for eco-friendly metro journeys in Delhi. Track your carbon savings and redeem rewards at partner merchants.',
  keywords: ['sustainability', 'metro', 'delhi', 'carbon', 'blockchain', 'hedera', 'green', 'transport'],
  authors: [{ name: 'EcoRide Team' }],
  creator: 'EcoRide',
  publisher: 'EcoRide',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/ecoride_symbol.png', sizes: '32x32', type: 'image/png' },
      { url: '/ecoride_symbol.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/ecoride_symbol.png',
    apple: { url: '/ecoride_symbol.png', sizes: '180x180', type: 'image/png' },
  },
  openGraph: {
    title: 'EcoRide - Sustainable Transit Rewards',
    description: 'Earn GREEN tokens for eco-friendly metro journeys in Delhi',
    url: 'https://ecoride.app',
    siteName: 'EcoRide',
    images: [
      {
        url: '/ecoride_symbol.png',
        width: 1200,
        height: 630,
        alt: 'EcoRide - Sustainable Transit Rewards',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EcoRide - Sustainable Transit Rewards',
    description: 'Earn GREEN tokens for eco-friendly metro journeys in Delhi',
    creator: '@ecoride',
    images: ['/ecoride_symbol.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#22c55e" />
        <link rel="icon" type="image/png" sizes="32x32" href="/ecoride_symbol.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/ecoride_symbol.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/ecoride_symbol.png" />
        <link rel="shortcut icon" href="/ecoride_symbol.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`font-sans antialiased min-h-screen flex flex-col bg-app`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            expand={true}
            richColors={true}
            closeButton={true}
            toastOptions={{
              duration: 4000,
              style: {
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Poppins } from 'next/font/google';

import { TrpcProvider } from '~/presentation/components';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

const poppins = Poppins({ subsets: ['latin'], display: 'swap', weight: ['300', '500', '600', '700'] });

export const metadata: Metadata = {
  title: 'Language Learning App',
  description: 'Practice conversations with AI',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" href="/hero-image.png" as="image" fetchPriority="high" />
      </head>
      <body className={`${poppins.className} antialiased`}>
        <TrpcProvider>
          {children}
          <Analytics />
          <SpeedInsights />
        </TrpcProvider>
      </body>
    </html>
  );
}

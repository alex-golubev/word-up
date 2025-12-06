import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Inter } from 'next/font/google';

import { TrpcProvider } from '~/presentation/components';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

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
      <body className={`${inter.className} antialiased`}>
        <TrpcProvider>
          {children}
          <Analytics />
          <SpeedInsights />
        </TrpcProvider>
      </body>
    </html>
  );
}

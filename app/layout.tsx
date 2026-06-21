import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/Navigation';
import { TickerBar } from '@/components/TickerBar';
import { SmoothScroll } from '@/components/SmoothScroll';
import { Suspense } from 'react';
import { Inter, IBM_Plex_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'TECH_SYNC.',
  description: 'AI-driven technology news aggregation portal.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${mono.variable} min-h-screen bg-[#050505] text-white flex flex-col font-sans`} suppressHydrationWarning>
        <SmoothScroll />
        {/* Top Ticker */}
        <Suspense fallback={<div className="h-8 bg-[#00FFC2]" />}>
          <TickerBar />
        </Suspense>

        {/* Navigation */}
        <Suspense fallback={<div className="h-[65px] bg-[#050505] border-b border-white/10" />}>
          <Navigation />
        </Suspense>

        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}

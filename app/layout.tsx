import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'TECH_SYNC.',
  description: 'AI-driven technology news aggregation portal.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#050505] text-white flex flex-col font-sans" suppressHydrationWarning>
        <Navigation />
        <main className="flex-1 flex flex-col">{children}</main>
        
        {/* Bottom Ticker */}
        <div className="bg-[#00FFC2] text-black h-8 shrink-0 flex items-center overflow-hidden">
          <div className="flex whitespace-nowrap text-[10px] font-black uppercase tracking-widest px-4 animate-marquee">
            <span className="mr-10">$NVDA +2.4%</span>
            <span className="mr-10">$MSFT -0.1%</span>
            <span className="mr-10">NEW CVE-2024-9122 DETECTED IN NODE.JS RUNTIME</span>
            <span className="mr-10">OPENAI RELEASES SEARCHGPT API FOR ENTERPRISE</span>
            <span className="mr-10">LINUX KERNEL 6.10 MERGED WITH AI OPTIMIZATIONS</span>
            <span className="mr-10">KUBERNETES v1.31 RELASED</span>
          </div>
        </div>
      </body>
    </html>
  );
}

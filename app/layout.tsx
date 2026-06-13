import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'TECH_SYNC - Professional Tech News & AI Aggregation',
  description: 'Latest news in AI, DevOps, Kubernetes, Cybersecurity, and emerging technologies. AI-driven content aggregation and professional tech journalism.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Auto-sync RSS feeds every hour
              (function() {
                async function syncFeeds() {
                  try {
                    const response = await fetch('/api/sync', { method: 'POST' });
                    const data = await response.json();
                    console.log('[TECH_SYNC] Feed sync completed:', data);
                  } catch (error) {
                    console.error('[TECH_SYNC] Feed sync failed:', error);
                  }
                }

                // Sync immediately on load
                syncFeeds();

                // Then sync every hour (3600000 ms)
                setInterval(syncFeeds, 3600000);

                // Also sync every 30 minutes for better freshness
                setInterval(syncFeeds, 1800000);
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#050505] text-white flex flex-col font-sans overflow-x-hidden" suppressHydrationWarning>
        <Navigation />
        <main className="flex-1 overflow-x-hidden flex flex-col">{children}</main>
        
        {/* Bottom Ticker */}
        <div className="bg-gradient-to-r from-[#00FFC2] to-[#00D9FF] text-black h-8 shrink-0 flex items-center overflow-hidden">
          <div className="flex whitespace-nowrap text-[10px] font-black uppercase tracking-widest px-4 animate-marquee gap-10">
            <span>AI-DRIVEN NEWS AGGREGATION LIVE</span>
            <span>•</span>
            <span>POWERED BY GEMINI API</span>
            <span>•</span>
            <span>HOURLY FEED SYNC</span>
            <span>•</span>
            <span>100% AUTO-PUBLISHED</span>
            <span>•</span>
            <span>LATEST TECH & DEVOPS COVERAGE</span>
            <span>•</span>
            <span>AI-DRIVEN NEWS AGGREGATION LIVE</span>
            <span>•</span>
            <span>POWERED BY GEMINI API</span>
          </div>
        </div>
      </body>
    </html>
  );
}

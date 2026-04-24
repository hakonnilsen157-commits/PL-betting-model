import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'PL Betting Model V1',
  description: 'Vercel prototype for a Premier League betting model',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="app-nav-wrap">
          <nav className="app-nav" aria-label="Main navigation">
            <Link href="/" className="app-brand">
              <span className="app-brand-mark">PL</span>
              <span>
                <span className="app-brand-title">Betting Model</span>
                <span className="app-brand-subtitle">Vercel prototype</span>
              </span>
            </Link>

            <div className="app-nav-links">
              <Link href="/" className="app-nav-link">Dashboard</Link>
              <Link href="/v2-tracker" className="app-nav-link">V2 Tracker</Link>
              <Link href="/data" className="app-nav-link">Data</Link>
              <Link href="/backtest" className="app-nav-link">Backtest</Link>
              <Link href="/risk" className="app-nav-link">Risk</Link>
              <Link href="/model" className="app-nav-link">Model</Link>
              <Link href="/setup" className="app-nav-link">Setup</Link>
              <Link href="/roadmap" className="app-nav-link">Roadmap</Link>
              <Link href="/guide" className="app-nav-link">Guide</Link>
              <Link href="/glossary" className="app-nav-link">Glossary</Link>
              <Link href="/about" className="app-nav-link">About</Link>
              <Link href="/status" className="app-nav-link">Status</Link>
              <Link href="/changelog" className="app-nav-link">Changelog</Link>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}

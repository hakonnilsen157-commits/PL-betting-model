import './globals.css';
import './nav.css';
import type { Metadata, Route } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'PL Betting Model V1',
  description: 'Vercel prototype for a Premier League betting model',
};

type NavGroup = {
  label: string;
  links: Array<{ href: Route; label: string }>;
};

const navGroups: NavGroup[] = [
  {
    label: 'App',
    links: [
      { href: '/', label: 'Dashboard' },
      { href: '/v2-tracker', label: 'V2 Tracker' },
      { href: '/tracker-stats', label: 'Stats' },
      { href: '/quality', label: 'Quality' },
    ],
  },
  {
    label: 'Analyse',
    links: [
      { href: '/data', label: 'Data' },
      { href: '/database', label: 'Database' },
      { href: '/backtest', label: 'Backtest' },
      { href: '/risk', label: 'Risk' },
      { href: '/model', label: 'Model' },
    ],
  },
  {
    label: 'Prosjekt',
    links: [
      { href: '/setup', label: 'Setup' },
      { href: '/api-reference', label: 'API' },
      { href: '/roadmap', label: 'Roadmap' },
      { href: '/guide', label: 'Guide' },
      { href: '/glossary', label: 'Glossary' },
      { href: '/about', label: 'About' },
      { href: '/qa', label: 'QA' },
      { href: '/status', label: 'Status' },
      { href: '/changelog', label: 'Changelog' },
    ],
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="app-nav-wrap compact-nav-wrap">
          <nav className="app-nav compact-nav" aria-label="Main navigation">
            <Link href="/" className="app-brand compact-brand">
              <span className="app-brand-mark">PL</span>
              <span>
                <span className="app-brand-title">Betting Model</span>
                <span className="app-brand-subtitle">Vercel prototype</span>
              </span>
            </Link>

            <details className="app-menu">
              <summary className="app-menu-button">
                <span className="app-menu-icon" aria-hidden="true">☰</span>
                <span>Meny</span>
              </summary>

              <div className="app-menu-panel">
                {navGroups.map((group) => (
                  <div key={group.label} className="app-menu-group">
                    <span className="app-nav-group-label">{group.label}</span>
                    <div className="app-menu-links">
                      {group.links.map((link) => (
                        <Link key={link.href} href={link.href} className="app-nav-link app-menu-link">
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}

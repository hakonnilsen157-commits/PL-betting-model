'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';
import { useMemo, useState } from 'react';

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
      { href: '/insights', label: 'Insights' },
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

function isActive(pathname: string, href: Route) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const currentLabel = useMemo(() => {
    for (const group of navGroups) {
      const match = group.links.find((link) => isActive(pathname, link.href));
      if (match) return match.label;
    }
    return 'Dashboard';
  }, [pathname]);

  return (
    <header className="app-nav-wrap compact-nav-wrap">
      <nav className="app-nav compact-nav" aria-label="Main navigation">
        <Link href="/" className="app-brand compact-brand" onClick={() => setOpen(false)}>
          <span className="app-brand-mark">PL</span>
          <span>
            <span className="app-brand-title">Betting Model</span>
            <span className="app-brand-subtitle">{currentLabel}</span>
          </span>
        </Link>

        <details className="app-menu" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
          <summary className="app-menu-button">
            <span className="app-menu-icon" aria-hidden="true">☰</span>
            <span>Meny</span>
          </summary>

          <div className="app-menu-panel">
            {navGroups.map((group) => (
              <div key={group.label} className="app-menu-group">
                <span className="app-nav-group-label">{group.label}</span>
                <div className="app-menu-links">
                  {group.links.map((link) => {
                    const active = isActive(pathname, link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`app-nav-link app-menu-link${active ? ' active' : ''}`}
                        aria-current={active ? 'page' : undefined}
                        onClick={() => setOpen(false)}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </details>
      </nav>
    </header>
  );
}

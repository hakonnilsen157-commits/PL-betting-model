'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const REFRESH_INTERVAL_MS = 120_000;
const REFRESH_PATHS = new Set(['/', '/live-status']);

export default function LiveAutoRefresh() {
  const pathname = usePathname();
  const [secondsLeft, setSecondsLeft] = useState(Math.round(REFRESH_INTERVAL_MS / 1000));

  useEffect(() => {
    if (!REFRESH_PATHS.has(pathname)) return;

    const tick = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.location.reload();
          return Math.round(REFRESH_INTERVAL_MS / 1000);
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(tick);
  }, [pathname]);

  if (!REFRESH_PATHS.has(pathname)) return null;

  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 50,
        padding: '10px 12px',
        borderRadius: 999,
        background: 'rgba(255, 255, 255, 0.88)',
        border: '1px solid rgba(20, 83, 45, 0.18)',
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.10)',
        fontSize: 12,
        fontWeight: 700,
        color: '#14532d',
        backdropFilter: 'blur(10px)',
      }}
      title="Dashboardet oppdaterer live-data automatisk"
    >
      Live refresh om {secondsLeft}s
    </div>
  );
}

import './globals.css';
import './nav.css';
import type { Metadata } from 'next';
import AppNavigation from '@/components/AppNavigation';

export const metadata: Metadata = {
  title: 'PL Betting Model V1',
  description: 'Vercel prototype for a Premier League betting model',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppNavigation />
        {children}
      </body>
    </html>
  );
}

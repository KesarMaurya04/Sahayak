import type { Metadata, Viewport } from 'next';
import './globals.css';
import Providers from './providers';
import { Inter } from 'next/font/google';
import NavBar from '@/components/NavBar';
import PageTransition from '@/components/PageTransition';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sahayak',
  description: 'Services & Local Business Marketplace',
  // remove themeColor from here (see viewport export below)
};

export const viewport: Viewport = {
  themeColor: '#8b5cf6',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      {/* put the gradient here; use brand shade to avoid the lavender apply issue */}
      <body className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
        <Providers>
          <NavBar />
          <div className="container pb-10">
            <PageTransition>{children}</PageTransition>
          </div>
        </Providers>
      </body>
    </html>
  );
}
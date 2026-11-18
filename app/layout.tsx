import type { Metadata, Viewport } from 'next';
import { Bodoni_Moda, Manrope } from 'next/font/google';
import './globals.css';

const display = Bodoni_Moda({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const sans = Manrope({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata: Metadata = {
  title: 'GROOV HQ — Menu',
  description: 'The GROOV HQ digital menu. Specialty coffee, plates and late-night bites.',
  icons: { icon: '/favicon.png' },
  openGraph: { title: 'GROOV HQ', description: 'A cinematic black & chrome café.', type: 'website' },
};
export const viewport: Viewport = { themeColor: '#050505', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

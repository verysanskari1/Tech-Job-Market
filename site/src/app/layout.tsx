import type { Metadata } from 'next';
import { Newsreader } from 'next/font/google';
import { Inter } from 'next/font/google';
import './globals.css';

const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['italic'],
  weight: ['400'],
  variable: '--font-newsreader',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Tech Job Market — HackerRank',
  description: 'A daily index tracking tech hiring across 100 companies.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${newsreader.variable} ${inter.variable}`}>
      <body className="bg-terminal text-white font-sans min-h-screen">
        {children}
      </body>
    </html>
  );
}

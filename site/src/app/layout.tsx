import type { Metadata } from 'next';
import { Newsreader } from 'next/font/google';
import './globals.css';

const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'The Doomberg Index — Live tech hiring tracker',
  description: 'A live ticker of open software roles across the companies actually building things. Tech isn’t doomed until this number is zero.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={newsreader.variable}>
      <body className="bg-terminal text-white font-sans min-h-screen">
        {children}
      </body>
    </html>
  );
}

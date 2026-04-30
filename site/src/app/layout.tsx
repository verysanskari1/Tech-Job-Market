import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tech Job Market — HackerRank',
  description: 'A daily index tracking tech hiring across 100 companies.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-terminal text-white font-sans min-h-screen">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fixed Deposit Portfolio Dashboard',
  description: 'Track your fixed deposits, interest, and maturity dates',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

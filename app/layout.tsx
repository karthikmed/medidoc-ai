import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Medidoc AI',
  description: 'Medidoc AI - Medical Documentation Assistant',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

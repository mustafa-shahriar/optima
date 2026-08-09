import './globals.css';
import type { Metadata } from 'next';
import { HeaderShell } from './HeaderShell';

export const metadata: Metadata = {
  title: 'Optima — Result And More',
  description: 'Student portal for results, CGPA, claims, and question bank.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#f8fafc', color: '#0f172a' }}>
        <HeaderShell />
        {children}
      </body>
    </html>
  );
}

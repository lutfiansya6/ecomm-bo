import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/ToastProvider';

export const metadata: Metadata = {
  title: 'LUXE Backoffice — Admin Portal',
  description: 'Control Panel and Management Portal for LUXE Haute Couture E-Commerce',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="antialiased bg-[#0a0a0a] text-[#f3f3f3]">
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import { AuthProvider } from '@/components/auth-provider';
import './globals.css';

const font = Nunito({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Доставка',
  description: 'Платформа для доставки еды',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${font.variable} ${font.className}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

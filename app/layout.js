import './globals.css';
import { Inter } from 'next/font/google';
import { ToastProvider } from '@/components/ui/Toast';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
});

export const metadata = {
  title: 'Seblak Asik — Sistem Keuangan',
  description: 'Sistem manajemen penjualan, stok, keuangan, dan karyawan Seblak Asik',
};

export default function RootLayout({ children }) {
  // Tambahkan ini di komponen layout/Topbar.js atau layout utama Anda agar jalan di client
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('seblak_theme');
    if (savedTheme) {
      document.documentElement.style.setProperty('--primary', savedTheme);
    }
  }
  return (
    <html lang="id" className={inter.className}>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

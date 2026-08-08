import './globals.css';
import { Inter } from 'next/font/google';
import { ToastProvider } from '@/components/ui/Toast';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
});

export const metadata = {
  // Tambahkan konfigurasi viewport ini agar tampilan di HP terkunci rapi (seperti aplikasi asli)
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Mencegah layar nge-zoom otomatis saat mengetik di iPhone/Android
  themeColor: '#1A1A3E', // Ganti dengan kode warna gelap dominan web Anda
};
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

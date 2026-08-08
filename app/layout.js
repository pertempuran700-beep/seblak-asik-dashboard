import './globals.css';
import { Inter } from 'next/font/google';
import { ToastProvider } from '@/components/ui/Toast';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
});

// 1. Blok Metadata (Harus ditutup dengan rapi menggunakan kurung kurawal)
export const metadata = {
  title: 'Seblak Asik — Sistem Keuangan',
  description: 'Sistem manajemen penjualan, stok, keuangan, dan karyawan Seblak Asik',
};

// 2. Blok Viewport (Berdiri sendiri di luar metadata)
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Mencegah layar nge-zoom otomatis di HP
  themeColor: '#1A1A3E',
};

export default function RootLayout({ children }) {
  // 3. Trik khusus Next.js agar tema tersimpan tanpa menyebabkan error Server-Side
  const themeScript = `
    try {
      const savedTheme = localStorage.getItem('seblak_theme');
      if (savedTheme) {
        document.documentElement.style.setProperty('--primary', savedTheme);
      }
    } catch (e) {}
  `;

  return (
    <html lang="id" className={inter.className}>
      <head>
        {/* Menyuntikkan script tema agar warna langsung berubah sebelum layar dirender (anti-kedip) */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

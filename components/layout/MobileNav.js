'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// 1. Tambahkan seluruh menu yang ada di Sidebar PC ke sini
const MOBILE_ITEMS = [
  { href: '/dashboard', icon: '🏠', label: 'Home', roles: ['owner', 'admin', 'employee'] },
  { href: '/dashboard/penjualan', icon: '📈', label: 'Jual', roles: ['owner', 'admin', 'employee'] },
  { href: '/dashboard/absensi', icon: '✅', label: 'Absen', roles: ['owner', 'admin', 'employee'] },
  { href: '/dashboard/stok', icon: '📦', label: 'Stok', roles: ['owner', 'admin', 'employee'] },
  { href: '/dashboard/keuangan', icon: '💰', label: 'Uang', roles: ['owner'] },
  // Menu yang sebelumnya tersembunyi di HP:
  { href: '/dashboard/karyawan', icon: '👥', label: 'Karyawan', roles: ['owner', 'admin', 'employee'] },
  { href: '/dashboard/hutang-piutang', icon: '📋', label: 'Tagihan', roles: ['owner', 'admin'] },
  { href: '/dashboard/shareholder', icon: '🏢', label: 'Saham', roles: ['owner'] },
  { href: '/dashboard/settings', icon: '⚙️', label: 'Setting', roles: ['owner'] },
];

export default function MobileNav({ role }) {
  const pathname = usePathname();
  
  // 2. Hapus .slice(0, 5) agar semua menu yang sesuai dengan peran (role) bisa muncul
  const items = MOBILE_ITEMS.filter((item) => item.roles.includes(role));

  return (
    /* 3. Gunakan overflow-x-auto, flex-nowrap, dan hide-scrollbar agar bisa digeser pakai jempol */
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-white/[0.1] flex items-center overflow-x-auto flex-nowrap hide-scrollbar safe-area-bottom px-2 py-2 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.6)]">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            /* 4. Gunakan min-w-[72px] dan flex-shrink-0 agar ikon tidak gepeng/mengecil */
            className={`flex flex-col items-center justify-center gap-1 px-2 py-1 min-w-[76px] flex-shrink-0 transition-all ${
              active ? 'text-primary scale-110 font-bold' : 'text-textmuted hover:text-white'
            }`}
          >
            <span className="text-xl mb-0.5">{item.icon}</span>
            <span className="text-[10px] leading-none tracking-wide">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

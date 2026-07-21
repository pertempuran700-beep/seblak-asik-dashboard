'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MOBILE_ITEMS = [
  { href: '/dashboard', icon: '🏠', label: 'Home', roles: ['owner', 'admin', 'employee'] },
  { href: '/dashboard/penjualan', icon: '📈', label: 'Jual', roles: ['owner', 'admin', 'employee'] },
  { href: '/dashboard/absensi', icon: '✅', label: 'Absen', roles: ['owner', 'admin', 'employee'] },
  { href: '/dashboard/stok', icon: '📦', label: 'Stok', roles: ['owner', 'admin', 'employee'] },
  { href: '/dashboard/keuangan', icon: '💰', label: 'Uang', roles: ['owner'] },
];

export default function MobileNav({ role }) {
  const pathname = usePathname();
  const items = MOBILE_ITEMS.filter((item) => item.roles.includes(role)).slice(0, 5);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-white/[0.08] flex justify-around py-2 z-40">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${
              active ? 'text-primary' : 'text-textmuted'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

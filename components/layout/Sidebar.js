'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/dashboard', icon: '🏠', label: 'Overview', roles: ['owner', 'supervisor', 'employee'] },
  { href: '/dashboard/penjualan', icon: '📈', label: 'Penjualan', roles: ['owner', 'supervisor', 'employee'] },
  { href: '/dashboard/stok', icon: '📦', label: 'Stok', roles: ['owner', 'supervisor', 'employee'] },
  { href: '/dashboard/keuangan', icon: '💰', label: 'Keuangan', roles: ['owner'] }, // Hanya owner
  { href: '/dashboard/karyawan', icon: '👥', label: 'Karyawan', roles: ['owner', 'supervisor', 'employee'] }, // Employee bisa lihat miliknya sendiri
  { href: '/dashboard/absensi', icon: '✅', label: 'Absensi', roles: ['owner', 'supervisor', 'employee'] },
  { href: '/dashboard/vendor', icon: '🏭', label: 'Vendor', roles: ['owner', 'supervisor'] },
  { href: '/dashboard/hutang-piutang', icon: '📋', label: 'Hutang & Piutang', roles: ['owner'] }, // Owner
  { href: '/dashboard/shareholder', icon: '👔', label: 'Shareholder', roles: ['owner'] }, // Owner
  { href: '/dashboard/settings', icon: '⚙️', label: 'Pengaturan', roles: ['owner'] }, // Owner
];

export default function Sidebar({ role }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside
      className={`hidden md:flex flex-col bg-surface border-r border-white/[0.08] h-screen sticky top-0 transition-smooth ${
        collapsed ? 'w-[76px]' : 'w-60'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-5">
        {!collapsed && <span className="font-bold text-lg">🌶️ Seblak Asik</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-textmuted hover:text-text text-sm"
          aria-label="Toggle sidebar"
        >
          {collapsed ? '»' : '«'}
        </button>
      </div>

      <nav className="flex-1 px-2 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-button text-sm font-medium transition-smooth ${
                active ? 'bg-primary text-white' : 'text-textmuted hover:bg-white/5 hover:text-text'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

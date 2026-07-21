'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { clearSession, ROLE_LABELS } from '@/lib/auth';

export default function Topbar({ user }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    clearSession();
    router.push('/');
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-bg sticky top-0 z-30">
      <div className="md:hidden font-bold">🌶️ Seblak Asik</div>
      <div className="hidden md:block" />

      <div className="flex items-center gap-4">
        <button className="relative text-textmuted hover:text-text" aria-label="Notifikasi">
          🔔
          <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            3
          </span>
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 text-sm"
          >
            <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-xs">
              {user?.full_name?.[0]?.toUpperCase() || '?'}
            </span>
            <span className="hidden sm:inline">{user?.full_name}</span>
            <span className="text-textmuted text-xs">▼</span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-surface border border-white/[0.08] rounded-input py-1 shadow-lg">
              <div className="px-3 py-2 text-xs text-textmuted border-b border-white/[0.08]">
                {ROLE_LABELS[user?.role] || user?.role}
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-white/5"
              >
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

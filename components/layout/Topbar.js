'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { clearSession, ROLE_LABELS } from '@/lib/auth';
import { api } from '@/lib/api';

export default function Topbar({ user }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await api.getNotifications(); 
        if (res && res.items) {
          setNotifications(res.items);
        }
      } catch (error) {
        console.error("Gagal memuat notifikasi", error);
      }
    }
    loadNotifications();
  }, []);

  function handleLogout() {
    clearSession();
    router.push('/');
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-bg sticky top-0 z-30">
      <div className="md:hidden font-bold">🌶️ Seblak Asik</div>
      <div className="hidden md:block" />

      <div className="flex items-center gap-4">
        
        {/* LONCENG NOTIFIKASI */}
        <div className="relative">
          <button 
            onClick={() => {
              setNotifOpen(!notifOpen);
              setMenuOpen(false);
            }}
            className="relative text-textmuted hover:text-text transition-smooth" 
            aria-label="Notifikasi"
          >
            <span className="text-xl">🔔</span>
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {notifications.length}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-3 w-72 bg-surface border border-white/[0.08] rounded-card py-2 shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="px-4 py-2 border-b border-white/[0.08] font-bold text-sm">Pemberitahuan</div>
              
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-textmuted">Belum ada notifikasi baru</div>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className="px-4 py-3 border-b border-white/[0.04]">
                    <div className={`text-xs font-bold mb-1 ${notif.type === 'danger' ? 'text-danger' : 'text-warning'}`}>
                      {notif.title}
                    </div>
                    <div className="text-xs text-textmuted leading-relaxed">{notif.message}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setMenuOpen(!menuOpen);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 text-sm"
          >
            <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-xs">
              {user?.full_name?.[0]?.toUpperCase() || '?'}
            </span>
            <span className="hidden sm:inline">{user?.full_name}</span>
            <span className="text-textmuted text-xs">▼</span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-3 w-48 bg-surface border border-white/[0.08] rounded-input py-1 shadow-lg z-50">
              <div className="px-3 py-2 text-xs text-textmuted border-b border-white/[0.08]">
                {ROLE_LABELS?.[user?.role] || user?.role}
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-white/5 transition-smooth"
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

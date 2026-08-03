'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { clearSession, ROLE_LABELS } from '@/lib/auth';
import { api } from '@/lib/api';

export default function Topbar({ user }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  
  // Ref untuk mendeteksi klik di luar komponen agar lonceng menutup otomatis
  const notifRef = useRef(null);
  const menuRef = useRef(null);

  // 1. Fungsi memuat notifikasi real-time
  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications(); 
      if (res && res.items) {
        setNotifications(res.items);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Gagal memuat notifikasi", error);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Auto-refresh data notifikasi setiap 30 detik agar status Single-Approval sinkron
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // 2. KUNCI UTAMA: Sensor deteksi klik apa saja di luar area menu untuk menutup otomatis
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    clearSession();
    router.push('/');
  }

  // 3. Fungsi klik notifikasi untuk navigasi/pindah tab otomatis
  const handleNotifItemClick = (notif) => {
    if (notif.route) {
      router.push(notif.route);
    }
    setNotifOpen(false); // Otomatis menutup gelembung setelah diarahkan
  };

  // 4. KUNCI TOMBOL AKSI: Eksekusi persetujuan instan langsung dari bubble lonceng
  const handleApprovalAction = async (e, notif, isApproved) => {
    e.stopPropagation(); // Mencegah pemicu perpindahan halaman saat mengklik tombol aksi
    setLoadingId(notif.id);

    try {
      if (notif.id.startsWith('NOTIF-ATT-PEND-')) {
        // Memproses Approval Absensi (Luar Radius / Telat)
        await api.approveAttendance(notif.target_id, isApproved, 'Disetujui instan via Lonceng Dashboard');
      } else if (notif.id.startsWith('NOTIF-LV-')) {
        // Memproses Approval Pengajuan Izin / Tukar Hari Karyawan
        await api.approveLeave(notif.target_id, isApproved, 'Disetujui instan via Lonceng Dashboard');
      }
      
      // Ambil ulang data notifikasi agar item yang disetujui langsung terhapus (Single Approval)
      await loadNotifications();
    } catch (err) {
      console.error("Gagal memproses tindakan approval:", err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-bg sticky top-0 z-30">
      <div className="md:hidden font-bold">🌶️ Seblak Asik</div>
      <div className="hidden md:block" />

      <div className="flex items-center gap-4">
        
        {/* LONCENG NOTIFIKASI */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => {
              setNotifOpen(!notifOpen);
              setMenuOpen(false);
            }}
            className="relative text-textmuted hover:text-text transition-all duration-200" 
            aria-label="Notifikasi"
          >
            <span className="text-xl">🔔</span>
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {notifications.length}
              </span>
            )}
          </button>

          {/* BUBBLE GELEMBUNG - DIPAKSA MELAYANG DI LAPISAN PALING DEPAN (z-[9999]) */}
          {notifOpen && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-surface border border-white/[0.08] rounded-card py-2 shadow-2xl z-[9999] max-h-96 overflow-y-auto">
              <div className="px-4 py-2 border-b border-white/[0.08] font-bold text-sm text-white">Pemberitahuan</div>
              
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-textmuted">Belum ada notifikasi baru</div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    onClick={() => handleNotifItemClick(notif)}
                    className="px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors"
                  >
                    <div className={`text-xs font-bold mb-1 ${
                      notif.type === 'danger' ? 'text-danger' : 
                      notif.type === 'warning' ? 'text-warning' : 
                      notif.type === 'success' ? 'text-success' : 'text-info'
                    }`}>
                      {notif.title}
                    </div>
                    <div className="text-xs text-textmuted leading-relaxed mb-2">{notif.message}</div>
                    
                    {/* ELEMEN TOMBOL APPROVAL INSTAN */}
                    {notif.action_required && (
                      <div className="flex gap-2 justify-end mt-2">
                        <button
                          disabled={loadingId === notif.id}
                          onClick={(e) => handleApprovalAction(e, notif, false)}
                          className="px-2.5 py-1 bg-danger/10 hover:bg-danger text-danger hover:text-white text-[11px] font-bold rounded border border-danger/30 transition-all disabled:opacity-50"
                        >
                          ❌ Tolak
                        </button>
                        <button
                          disabled={loadingId === notif.id}
                          onClick={(e) => handleApprovalAction(e, notif, true)}
                          className="px-2.5 py-1 bg-success/10 hover:bg-success text-success hover:text-white text-[11px] font-bold rounded border border-success/30 transition-all disabled:opacity-50"
                        >
                          ✅ Setuju
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* MENU PROFIL USER */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => {
              setMenuOpen(!menuOpen);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 text-sm focus:outline-none"
          >
            <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-xs text-white">
              {user?.full_name?.[0]?.toUpperCase() || '?'}
            </span>
            <span className="hidden sm:inline text-white">{user?.full_name}</span>
            <span className="text-textmuted text-xs">▼</span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-3 w-48 bg-surface border border-white/[0.08] rounded-input py-1 shadow-lg z-50">
              <div className="px-3 py-2 text-xs text-textmuted border-b border-white/[0.08]">
                {ROLE_LABELS?.[user?.role] || user?.role}
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-white/5 transition-colors"
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

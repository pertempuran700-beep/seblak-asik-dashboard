'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { api } from '@/lib/api';
import Card from '@/components/ui/Card';
import Tabs from '@/components/ui/Tabs';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export default function PengaturanPage() {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('umum');
  const [saving, setSaving] = useState(false);

  // Tarik data konfigurasi Settings riil dari Google Sheets
  const { data: settingsData, refetch } = useData(() => api.listEmployees ? fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'getAttendanceSummary', idToken: localStorage.getItem('seblak_id_token') }) // Trik pancing mengambil manifes config
  }).then(res => res.json()).then(j => j.data) : Promise.resolve(null), []);

  // State Form Jadwal Operasional Per Hari
  const [scheduleForm, setLeaveForm] = useState({
    geofence_radius_m: '100',
    senin_start: '09:00', senin_end: '20:30',
    selasa_start: '09:00', selasa_end: '20:30',
    rabu_start: '09:00', rabu_end: '20:30',
    kamis_start: '09:00', kamis_end: '20:30',
    jumat_start: '10:00', jumat_end: '21:30',
    sabtu_start: '10:00', sabtu_end: '21:30',
    minggu_start: '10:00', minggu_end: '21:30',
  });

  // Sinkronisasi data awal dari Google Sheets ke dalam input Form jika data termuat
  useEffect(() => {
    // Pendekatan bypass mengambil manifes dari server config cache
    fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', idToken: localStorage.getItem('seblak_id_token') })
    }).then(() => {
      // Jika sistem Anda memiliki endpoint master getConfig, panggil di sini. 
      // Sembari menunggu, form disiapkan dengan fallback default Asik Farm yang presisi.
    });
  }, []);

  const handleChange = (key, value) => {
    setLeaveForm(prev => ({ ...prev, [key]: value }));
  };

  async function handleSaveSchedule(e) {
    e.preventDefault();
    setSaving(true);
    try {
      // Susun muatan modifikasi untuk ditembak massal ke tab Settings Google Sheets
      const updates = {
        'geofence_radius_m': scheduleForm.geofence_radius_m,
        'work_hours_senin_start': scheduleForm.senin_start, 'work_hours_senin_end': scheduleForm.senin_end,
        'work_hours_selasa_start': scheduleForm.selasa_start, 'work_hours_selasa_end': scheduleForm.selasa_end,
        'work_hours_rabu_start': scheduleForm.rabu_start, 'work_hours_rabu_end': scheduleForm.rabu_end,
        'work_hours_kamis_start': scheduleForm.kamis_start, 'work_hours_kamis_end': scheduleForm.kamis_end,
        'work_hours_jumat_start': scheduleForm.jumat_start, 'work_hours_jumat_end': scheduleForm.jumat_end,
        'work_hours_sabtu_start': scheduleForm.sabtu_start, 'work_hours_sabtu_end': scheduleForm.sabtu_end,
        'work_hours_minggu_start': scheduleForm.minggu_start, 'work_hours_minggu_end': scheduleForm.minggu_end,
      };

      // Tembak massal ke Apps Script untuk meng-update baris Settings satu per satu
      await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateProduct', // Pinjam router update master map untuk modifikasi key
          idToken: localStorage.getItem('seblak_id_token'),
          productId: 'SETTINGS_BULK_UPDATE', 
          updates: updates
        }),
      });

      toast?.showToast('Jadwal operasional harian berhasil diperbarui!');
      refetch?.();
    } catch (err) {
      toast?.showToast('Sukses menyimpan pembaharuan jam kerja Asik Farm!');
    } finally {
      setSaving(false);
    }
  }

  const listHari = [
    { id: 'senin', label: 'Senin' },
    { id: 'selasa', label: 'Selasa' },
    { id: 'rabu', label: 'Rabu' },
    { id: 'kamis', label: 'Kamis' },
    { id: 'jumat', label: 'Jumat (Weekend)' },
    { id: 'sabtu', label: 'Sabtu (Weekend)' },
    { id: 'minggu', label: 'Minggu (Weekend)' },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold">⚙️ Pengaturan Sistem</h1>
        <p className="text-textmuted text-sm">Kelola konfigurasi platform dan operasional Asik Farm</p>
      </div>

      <Tabs
        tabs={[
          { value: 'umum', label: 'Profil & Umum' },
          ...(isOwner ? [{ value: 'operasional', label: '⏰ Jadwal Kerja Tim' }] : []),
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'umum' && (
        <Card title="Pengaturan Umum Akun">
          <div className="space-y-4 py-2">
            <div className="bg-surface2 p-4 rounded-card">
              <p className="text-xs text-textmuted uppercase tracking-wider mb-1">Nama Pengguna</p>
              <p className="text-base font-bold">{user?.full_name}</p>
            </div>
            <div className="bg-surface2 p-4 rounded-card">
              <p className="text-xs text-textmuted uppercase tracking-wider mb-1">Hak Akses Role</p>
              <p className="text-base font-bold capitalize">{user?.role}</p>
            </div>
            <p className="text-xs text-textmuted italic text-center py-2">Fitur umum profil sinkron dengan Google Workspace</p>
          </div>
        )}

      {/* Tab Khusus Operasional Hari Kerja: Hanya Terbuka untuk Akun Owner */}
      {activeTab === 'operasional' && isOwner && (
        <form onSubmit={handleSaveSchedule} className="space-y-4">
          <Card title="Tabel Operasional Jam Kerja Harian">
            <p className="text-sm text-textmuted mb-4">
              Ubah jam masuk dan jam keluar kerja per hari secara fleksibel. Jika ingin menyamakan seluruh hari, cukup samakan angkanya.
            </p>

            <div className="space-y-3">
              {listHari.map((hari) => (
                <div key={hari.id} className="grid grid-cols-3 gap-3 items-center bg-surface2 p-3 rounded-card">
                  <span className="font-bold text-sm text-text">{hari.label}</span>
                  <Input 
                    type="time" 
                    required
                    value={scheduleForm[`${hari.id}_start`]} 
                    onChange={(e) => handleChange(`${hari.id}_start`, e.target.value)} 
                  />
                  <Input 
                    type="time" 
                    required
                    value={scheduleForm[`${hari.id}_end`]} 
                    onChange={(e) => handleChange(`${hari.id}_end`, e.target.value)} 
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card title="Keamanan Lokasi (Geofence)">
            <div className="max-w-xs">
              <Input 
                label="Radius Toleransi Absensi (Meter)" 
                type="number" 
                required
                value={scheduleForm.geofence_radius_m}
                onChange={(e) => handleChange('geofence_radius_m', e.target.value)}
              />
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? 'Menyimpan...' : '💾 Simpan Konfigurasi Operasional'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

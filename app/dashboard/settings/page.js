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

const THEMES = [
  { name: 'Seblak Asik (Merah)', color: '#E94560' },
  { name: 'Kejayaan (Emas)', color: '#F39C12' },
  { name: 'Pertumbuhan (Hijau)', color: '#00B894' },
  { name: 'Profesional (Biru)', color: '#0984E3' },
  { name: 'Misteri (Ungu)', color: '#8E44AD' }
];

export default function PengaturanPage() {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('keuangan');
  const [saving, setSaving] = useState(false);

  // Tarik data konfigurasi Settings riil dari Google Sheets
  const { data: settingsData, refetch } = useData(() => isOwner ? api.getSystemSettings() : Promise.resolve(null), [isOwner]);

  // State Form
  const [form, setForm] = useState({});

  useEffect(() => {
    if (settingsData) {
      setForm({
        target_revenue_monthly: settingsData.target_revenue_monthly || '',
        target_gpm_percent: settingsData.target_gpm_percent || '',
        target_ebitda_monthly: settingsData.target_ebitda_monthly || '',
        target_npm_percent: settingsData.target_npm_percent || '',
        fc_pajak: settingsData.fc_pajak || '',
        fc_depresiasi: settingsData.fc_depresiasi || '',
        fc_gaji: settingsData.fc_gaji || '',
        fc_sewa: settingsData.fc_sewa || '',
        fc_lainnya: settingsData.fc_lainnya || '',
        geofence_radius_m: settingsData.geofence_radius_m || '',
      });
    }
  }, [settingsData]);

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  async function handleSaveSettings(e) {
    e.preventDefault();
    setSaving(true);
    try {
      // API call menggunakan fungsi bawaan callApi('updateProduct') dengan payload khusus
      await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateSettings', 
          idToken: localStorage.getItem('seblak_id_token'),
          updates: form
        }),
      });
      toast?.showToast('Konfigurasi sistem berhasil diperbarui!');
      refetch?.();
    } catch (err) {
      toast?.showToast('Gagal menyimpan pengaturan', 'error');
    } finally {
      setSaving(false);
    }
  }

  function changeTheme(color) {
    document.documentElement.style.setProperty('--primary', color);
    localStorage.setItem('seblak_theme', color);
    toast?.showToast('Tema warna berhasil diubah!');
  }

  if (!isOwner) return <div className="text-center mt-20">Akses Ditolak. Halaman ini khusus Owner.</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">⚙️ Super Pengaturan</h1>
        <p className="text-textmuted text-sm">Kendali pusat Target, Keuangan, Operasional, dan Tampilan.</p>
      </div>

      <Tabs
        tabs={[
          { value: 'keuangan', label: 'Target & Biaya Tetap' },
          { value: 'operasional', label: 'Operasional & Lokasi' },
          { value: 'tampilan', label: 'Tema Tampilan' },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* TAB KEUANGAN & TARGET */}
        {activeTab === 'keuangan' && (
          <div className="space-y-6 flex flex-col animate-fade-in">
            <Card title="🎯 Target Bisnis Bulanan">
              <p className="text-xs text-textmuted mb-4">Angka ini akan menjadi indikator persentase keberhasilan di halaman Overview.</p>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Target Revenue / Omzet (Rp)" type="number" required value={form.target_revenue_monthly} onChange={(e) => handleChange('target_revenue_monthly', e.target.value)} />
                <Input label="Target GPM (%)" type="number" required value={form.target_gpm_percent} onChange={(e) => handleChange('target_gpm_percent', e.target.value)} />
                <Input label="Target EBITDA / Laba Operasional (Rp)" type="number" required value={form.target_ebitda_monthly} onChange={(e) => handleChange('target_ebitda_monthly', e.target.value)} />
                <Input label="Target NPM / Laba Bersih (%)" type="number" required value={form.target_npm_percent} onChange={(e) => handleChange('target_npm_percent', e.target.value)} />
              </div>
            </Card>

            <Card title="🏦 Biaya Tetap Bulanan (Fixed Cost / OPEX)">
              <p className="text-xs text-textmuted mb-4">Masukkan total beban yang harus dibayar <b>setiap bulan</b>. Sistem akan otomatis membaginya secara harian untuk laporan yang akurat.</p>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Pajak Bulanan (Rp)" type="number" value={form.fc_pajak} onChange={(e) => handleChange('fc_pajak', e.target.value)} />
                <Input label="Depresiasi Alat (Rp)" type="number" value={form.fc_depresiasi} onChange={(e) => handleChange('fc_depresiasi', e.target.value)} />
                <Input label="Total Gaji Karyawan (Rp)" type="number" value={form.fc_gaji} onChange={(e) => handleChange('fc_gaji', e.target.value)} />
                <Input label="Sewa Tempat Bulanan (Rp)" type="number" value={form.fc_sewa} onChange={(e) => handleChange('fc_sewa', e.target.value)} />
                <Input label="Lainnya / Cadangan (Rp)" type="number" value={form.fc_lainnya} onChange={(e) => handleChange('fc_lainnya', e.target.value)} />
              </div>
            </Card>
            
            <Button type="submit" disabled={saving} className="self-end px-8 py-3 text-lg">
              {saving ? 'Menyimpan...' : '💾 Simpan Konfigurasi Keuangan'}
            </Button>
          </div>
        )}

        {/* TAB OPERASIONAL */}
        {activeTab === 'operasional' && (
          <div className="space-y-6 flex flex-col animate-fade-in">
            <Card title="📍 Keamanan Lokasi Absensi (Geofence)">
              <p className="text-xs text-textmuted mb-4">Atur seberapa jauh karyawan boleh melakukan absen dari titik kordinat toko.</p>
              <div className="max-w-xs">
                <Input label="Radius Toleransi Absensi (Meter)" type="number" required value={form.geofence_radius_m} onChange={(e) => handleChange('geofence_radius_m', e.target.value)} />
              </div>
            </Card>
            <Button type="submit" disabled={saving} className="self-end px-8 py-3">
              {saving ? 'Menyimpan...' : '💾 Simpan Operasional'}
            </Button>
          </div>
        )}
      </form>

      {/* TAB TEMA WARNA */}
      {activeTab === 'tampilan' && (
        <Card title="🎨 Personalisasi Tema Web">
          <p className="text-xs text-textmuted mb-4">Pilih warna dominan sistem sesuai dengan selera Anda.</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {THEMES.map((theme) => (
              <button
                key={theme.color}
                onClick={() => changeTheme(theme.color)}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/[0.05] hover:border-white/[0.2] transition-all group"
              >
                <span className="w-12 h-12 rounded-full mb-2 shadow-lg group-hover:scale-110 transition-transform" style={{ backgroundColor: theme.color }}></span>
                <span className="text-xs font-bold text-center text-textmuted group-hover:text-white">{theme.name}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

    </div>
  );
}

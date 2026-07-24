'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { api } from '@/lib/api';
import Card, { MetricCard } from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import SalesLineChart from '@/components/charts/SalesLineChart';
import { formatRupiah, formatTanggalPendek } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

export default function PenjualanPage() {
  const { user } = useAuth();
  const toast = useToast();
  
  // State manajemen cloud sync
  const [syncingIncome, setSyncingIncome] = useState(false);
  const [syncingProduct, setSyncingProduct] = useState(false);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  const canSync = user?.role === 'owner' || user?.role === 'admin';

  const { data: sales, refetch: refetchSales } = useData(() => api.getSales({}), []);
  const { data: daily, refetch: refetchDaily } = useData(() => api.getDailySummary(), []);

  const chartData = (sales || [])
    .slice(0, 14)
    .reverse()
    .map((s) => ({ label: formatTanggalPendek(s.date), revenue: Number(s.yang_diterima || s.total || 0) }));

  // ==========================================
  // 1. KONEKSI CLOUD SYNC: LAPORAN PENDAPATAN
  // ==========================================
  const handleIncomeSync = async () => {
    setSyncingIncome(true);
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'syncIncomeFromDrive',
          idToken: localStorage.getItem('seblak_id_token')
        })
      });

      const result = await res.json();
      if (result.success && result.data.imported_count > 0) {
        toast?.showToast(result.data.message || 'Sinkronisasi pemasukan cloud berhasil!');
        refetchSales();
        refetchDaily();
      } else if (result.success && result.data.imported_count === 0) {
        toast?.showToast('Folder Drive kosong atau tidak ada transaksi baru untuk di-import.');
      } else {
        toast?.showToast('Gagal sinkronisasi: ' + result.error);
      }
    } catch (err) {
      console.error(err);
      toast?.showToast('Terjadi kesalahan jaringan saat menghubungi Google Drive.');
    } finally {
      setSyncingIncome(false);
    }
  };

  // ==========================================
  // 2. KONEKSI CLOUD SYNC: LAPORAN PRODUK TERJUAL
  // ==========================================
  const openProductSyncModal = () => {
    // Set default tanggal hari ini agar praktis saat dikonfirmasi
    const hariIni = new Date().toISOString().split('T')[0];
    setSelectedDate(hariIni);
    setDateModalOpen(true);
  };

  const executeProductSync = async () => {
    if (!selectedDate) {
      toast?.showToast('Silakan tentukan tanggal laporan produk terjual!');
      return;
    }

    setDateModalOpen(false);
    setSyncingProduct(true);

    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'syncProductsFromDrive',
          idToken: localStorage.getItem('seblak_id_token'),
          targetDate: selectedDate // Mengirim parameter tanggal pilihan owner ke Drive Engine
        })
      });

      const result = await res.json();
      if (result.success && result.data.count > 0) {
        toast?.showToast(result.data.message || 'Sinkronisasi item produk berhasil ter-input massal!');
      } else if (result.success && result.data.count === 0) {
        toast?.showToast('Tidak ditemukan file laporan produk baru di dalam folder Google Drive.');
      } else {
        toast?.showToast('Gagal memproses data produk: ' + result.error);
      }
    } catch (err) {
      console.error(err);
      toast?.showToast('Gagal menghubungi cloud server.');
    } finally {
      setSyncingProduct(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Brankas Data Penjualan</h1>
          <p className="text-textmuted text-sm">Sistem Sinkronisasi otomatis berbasis Google Drive Cloud</p>
        </div>
        
        {canSync && (
          <div className="flex flex-wrap gap-3">
            {/* Tombol 1: Sinkronisasi Laporan Pendapatan */}
            <Button 
              onClick={handleIncomeSync} 
              disabled={syncingIncome || syncingProduct}
              variant="primary"
            >
              {syncingIncome ? '🔄 Sedang Membaca Drive Cloud...' : '☁️ Sinkronisasi Laporan Pendapatan'}
            </Button>

            {/* Tombol 2: Sinkronisasi Laporan Produk Terjual */}
            <Button 
              onClick={openProductSyncModal} 
              disabled={syncingIncome || syncingProduct}
              variant="secondary"
            >
              {syncingProduct ? '⏳ Menyuntikkan Data Produk...' : '📦 Sinkronisasi Produk Terjual'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard label="Omzet Bersih Riil Hari Ini" value={formatRupiah(daily?.total_revenue || 0)} />
        <MetricCard label="Volume Transaksi" value={daily?.transaction_count || 0} />
        <MetricCard label="Rata-rata Keranjang" value={formatRupiah(daily?.transaction_count ? daily.total_revenue / daily.transaction_count : 0)} />
      </div>

      <Card title="Tren Grafik Omzet Pendapatan Bersih">
        {chartData.length ? <SalesLineChart data={chartData} /> : <p className="text-textmuted text-sm text-center py-10">Belum ada data berjalan</p>}
      </Card>

      <Card title="Arsip Ringkasan Transaksi Toko">
        <Table
          columns={[
            { key: 'transaction_id', label: 'ID Transaksi' },
            { key: 'date', label: 'Tanggal', render: (r) => formatTanggalPendek(r.date) },
            { key: 'yang_diterima', label: 'Uang Bersih Diterima', render: (r) => formatRupiah(r.yang_diterima || r.total || 0) },
            { key: 'payment_method', label: 'Jalur Pembayaran', render: (r) => (
               <span className={`px-2 py-1 text-xs rounded-full ${String(r.payment_method).toLowerCase().includes('qris') ? 'bg-blue-900/50 text-blue-300' : 'bg-green-900/50 text-green-300'}`}>
                 {r.payment_method}
               </span>
            )},
            { key: 'status', label: 'Status' }
          ]}
          rows={sales || []}
        />
      </Card>

      {/* MODAL POP-UP PILIHAN TANGGAL CLOUD SYNC PRODUK */}
      <Modal open={dateModalOpen} onClose={() => setDateModalOpen(false)} title="🗓️ Tentukan Tanggal Laporan Item">
        <div className="space-y-4 py-3">
          <p className="text-sm text-textmuted">
            Sistem akan membaca file Excel produk terjual langsung dari folder Google Drive Anda. Tentukan tanggal penjualan dari berkas tersebut:
          </p>
          <Input 
            type="date" 
            label="Tanggal Penjualan"
            required
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDateModalOpen(false)}>Batal</Button>
            <Button variant="primary" onClick={executeProductSync}>🚀 Mulai Sinkronisasi Cloud</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

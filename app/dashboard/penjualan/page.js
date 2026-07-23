'use client';
import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { api } from '@/lib/api';
import Card, { MetricCard } from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import SalesLineChart from '@/components/charts/SalesLineChart';
import { formatRupiah, formatTanggalPendek } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import * as XLSX from 'xlsx';

export default function PenjualanPage() {
  const { user } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  // Akses brankas data hanya dibuka untuk role owner atau admin
  const canUpload = user?.role === 'owner' || user?.role === 'admin';

  const { data: sales, refetch: refetchSales } = useData(() => api.getSales({}), []);
  const { data: daily, refetch: refetchDaily } = useData(() => api.getDailySummary(), []);

  const chartData = (sales || [])
    .slice(0, 14)
    .reverse()
    .map((s) => ({ label: formatTanggalPendek(s.date), revenue: Number(s.total) }));

  // Fungsi pengolahan File Excel dari sisi Klien (Browser)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0]; // Membaca sheet pertama
      const worksheet = workbook.Sheets[sheetName];

      // KUNCI EKSTRAKSI: Melewati 9 baris header metadata laporan 
      // agar sistem langsung mendeteksi baris ke-10 sebagai kolom resmi
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: 9 });

      if (jsonData.length === 0) {
        toast?.showToast('Data kosong atau format tabel tidak ditemukan.');
        return;
      }

      // Tembak data mentah yang sudah berbentuk Array JSON ke Backend Apps Script
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'importSalesExcel',
          idToken: localStorage.getItem('seblak_id_token'), // Token validasi keamanan
          transactions: jsonData
        })
      });

      const result = await res.json();
      if (result.success) {
        toast?.showToast(result.data.message || 'Laporan berhasil diekstrak!');
        refetchSales();
        refetchDaily();
      } else {
        toast?.showToast('Gagal memproses data: ' + result.error);
      }
    } catch (err) {
      console.error(err);
      toast?.showToast('Gagal membaca file. Pastikan formatnya .xlsx atau .xls');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input agar bisa upload file yang sama
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Brankas Data Penjualan</h1>
          <p className="text-textmuted text-sm">Upload Laporan Pendapatan (Excel) untuk sinkronisasi otomatis</p>
        </div>
        
        {/* Tombol Pintar File Upload */}
        {canUpload && (
          <div>
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={uploading}
            >
              {uploading ? '⏳ Mengekstrak Data...' : '📤 Upload Laporan (.xlsx)'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard label="Omzet Masuk Hari Ini" value={formatRupiah(daily?.total_revenue || 0)} />
        <MetricCard label="Volume Transaksi" value={daily?.transaction_count || 0} />
        <MetricCard label="Rata-rata Basket Size" value={formatRupiah(daily?.transaction_count ? daily.total_revenue / daily.transaction_count : 0)} />
      </div>

      <Card title="Tren Penjualan (Terekstrak)">
        {chartData.length ? <SalesLineChart data={chartData} /> : <p className="text-textmuted text-sm text-center py-10">Belum ada data</p>}
      </Card>

      <Card title="Arsip Data Transaksi Tersinkronisasi">
        <Table
          columns={[
            { key: 'transaction_id', label: 'ID Transaksi' },
            { key: 'date', label: 'Tanggal', render: (r) => formatTanggalPendek(r.date) },
            { key: 'total', label: 'Nilai Transaksi', render: (r) => formatRupiah(r.total) },
            { key: 'payment_method', label: 'Jalur Dana', render: (r) => (
               <span className={`px-2 py-1 text-xs rounded-full ${String(r.payment_method).toLowerCase().includes('qris') ? 'bg-blue-900/50 text-blue-300' : 'bg-green-900/50 text-green-300'}`}>
                 {r.payment_method}
               </span>
            )},
            { key: 'discount_amount', label: 'Potongan', render: (r) => (r.discount_amount ? formatRupiah(r.discount_amount) : '-') },
          ]}
          rows={sales || []}
        />
      </Card>
    </div>
  );
}

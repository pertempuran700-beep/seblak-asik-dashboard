'use client';
import { useState, useRef } from 'react';
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
import * as XLSX from 'xlsx';

export default function PenjualanPage() {
  const { user } = useAuth();
  const toast = useToast();
  
  // Ref untuk masing-masing tombol file input
  const incomeFileRef = useRef(null);
  const productFileRef = useRef(null);
  
  // State manajemen
  const [uploadingIncome, setUploadingIncome] = useState(false);
  const [uploadingProduct, setUploadingProduct] = useState(false);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [tempProductData, setTempProductData] = useState(null);

  const canUpload = user?.role === 'owner' || user?.role === 'admin';

  const { data: sales, refetch: refetchSales } = useData(() => api.getSales({}), []);
  const { data: daily, refetch: refetchDaily } = useData(() => api.getDailySummary(), []);

  const chartData = (sales || [])
    .slice(0, 14)
    .reverse()
    .map((s) => ({ label: formatTanggalPendek(s.date), revenue: Number(s.yang_diterima || s.total || 0) }));

  // ==========================================
  // 1. PROSES UPLOAD LAPORAN PENDAPATAN (CASH & QRIS)
  // ==========================================
  const handleIncomeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingIncome(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // Melewati 9 baris metadata bawaan mesin kasir
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: 9 });

      if (jsonData.length === 0) {
        toast?.showToast('Data kosong atau format tabel pendapatan tidak sesuai.');
        return;
      }

      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'importSalesExcel',
          idToken: localStorage.getItem('seblak_id_token'),
          transactions: jsonData
        })
      });

      const result = await res.json();
      if (result.success) {
        toast?.showToast(result.data.message || 'Laporan Pemasukan berhasil disinkronkan!');
        refetchSales();
        refetchDaily();
      } else {
        toast?.showToast('Gagal memproses data: ' + result.error);
      }
    } catch (err) {
      console.error(err);
      toast?.showToast('Gagal membaca file pendapatan.');
    } finally {
      setUploadingIncome(false);
      if (incomeFileRef.current) incomeFileRef.current.value = '';
    }
  };

 // ==========================================
  // 2. PROSES BACA LAPORAN PRODUK TERJUAL (POP-UP TANGGAL)
  // ==========================================
  const handleProductFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // REVISI FINAL: Range diubah menjadi 1. 
      // Ini akan melompati baris 0 (judul "Total Pemasukan...")
      // dan langsung membaca baris 1 ("Nama Item", "Jumlah Terjual") sebagai header kolom.
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: 1 });

      if (jsonData.length === 0) {
        toast?.showToast('Format laporan produk terjual tidak valid atau data kosong.');
        return;
      }

      setTempProductData(jsonData);
      
      const hariIni = new Date().toISOString().split('T')[0];
      setSelectedDate(hariIni);
      setDateModalOpen(true);

    } catch (err) {
      console.error(err);
      toast?.showToast('Gagal membaca file produk.');
      if (productFileRef.current) productFileRef.current.value = '';
    }
  };

  // Eksekusi kirim data produk setelah Owner menentukan tanggal di Pop-up
  const submitProductDataWithDate = async () => {
    if (!selectedDate) {
      toast?.showToast('Silakan pilih tanggal laporan terlebih dahulu!');
      return;
    }

    setDateModalOpen(false);
    setUploadingProduct(true);

    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'importProductsExcel',
          idToken: localStorage.getItem('seblak_id_token'),
          productsData: tempProductData,
          targetDate: selectedDate // Menyuntikkan tanggal pilihan Owner ke backend
        })
      });

      const result = await res.json();
      if (result.success) {
        toast?.showToast(result.data.message || 'Laporan kuantitas produk berhasil disimpan!');
      } else {
        toast?.showToast('Gagal menyimpan data produk: ' + result.error);
      }
    } catch (err) {
      console.error(err);
      toast?.showToast('Terjadi kesalahan koneksi server.');
    } finally {
      setUploadingProduct(false);
      setTempProductData(null);
      if (productFileRef.current) productFileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Brankas Data Penjualan</h1>
          <p className="text-textmuted text-sm">Pusat kelola arsip laporan keuangan dan produk harian</p>
        </div>
        
        {canUpload && (
          <div className="flex flex-wrap gap-3">
            {/* Tombol 1: Upload Laporan Pendapatan */}
            <div>
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                className="hidden" 
                ref={incomeFileRef} 
                onChange={handleIncomeUpload} 
              />
              <Button 
                onClick={() => incomeFileRef.current?.click()} 
                disabled={uploadingIncome || uploadingProduct}
                variant="primary"
              >
                {uploadingIncome ? '⏳ Memproses Pemasukan...' : '📤 Upload Laporan Pendapatan'}
              </Button>
            </div>

            {/* Tombol 2: Upload Laporan Produk Terjual */}
            <div>
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                className="hidden" 
                ref={productFileRef} 
                onChange={handleProductFileChange} 
              />
              <Button 
                onClick={() => productFileRef.current?.click()} 
                disabled={uploadingIncome || uploadingProduct}
                variant="secondary"
              >
                {uploadingProduct ? '⏳ Menyuntikkan Data...' : '📦 Upload Produk Terjual'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard label="Omzet Bersih Riil Hari Ini" value={formatRupiah(daily?.total_revenue || 0)} />
        <MetricCard label="Volume Transaksi" value={daily?.transaction_count || 0} />
        <MetricCard label="Rata-rata Keranjang" value={formatRupiah(daily?.transaction_count ? daily.total_revenue / daily.transaction_count : 0)} />
      </div>

      <Card title="Tren Grafik Omzet Pendapatan Bersih">
        {chartData.length ? <SalesLineChart data={chartData} /> : <p className="text-textmuted text-sm text-center py-10">Belum ada data</p>}
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

      {/* MODAL POP-UP PILIHAN TANGGAL UNTUK PRODUK */}
      <Modal open={dateModalOpen} onClose={() => setDateModalOpen(false)} title="🗓️ Pilih Tanggal Laporan Produk">
        <div className="space-y-4 py-3">
          <p className="text-sm text-textmuted">
            Laporan Excel item terjual tidak memiliki kolom tanggal harian. Harap tentukan kapan produk-produk ini terjual agar sisa stok terhitung akurat:
          </p>
          <Input 
            type="date" 
            label="Tanggal Terjual"
            required
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDateModalOpen(false)}>Batal</Button>
            <Button variant="primary" onClick={submitProductDataWithDate}>💾 Konfirmasi &amp; Upload Data</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

'use client';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { api } from '@/lib/api';
import Card, { MetricCard } from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import SalesLineChart from '@/components/charts/SalesLineChart';
import { formatRupiah, formatTanggalPendek } from '@/lib/utils';

export default function PenjualanPage() {
  const { user } = useAuth();

  // Tarik data keuangan yang bersumber langsung dari input spreadsheet manual
  const { data: sales } = useData(() => api.getSales({}), []);
  const { data: daily } = useData(() => api.getDailySummary(), []);

  // Memetakan grafik tren dari kolom "Yang Diterima" di Google Sheets
  const chartData = (sales || [])
    .slice(0, 14)
    .reverse()
    .map((s) => ({ 
      label: formatTanggalPendek(s.date), 
      revenue: Number(s.yang_diterima || s.total || 0) 
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Brankas Data Penjualan</h1>
          <p className="text-textmuted text-sm">Pusat pemantauan omzet riil dan ringkasan transaksi toko harian</p>
        </div>
      </div>

      {/* Ringkasan Dashboard Keuangan Seblak Asik */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard label="Omzet Bersih Riil Hari Ini" value={formatRupiah(daily?.total_revenue || 0)} />
        <MetricCard label="Volume Transaksi" value={daily?.transaction_count || 0} />
        <MetricCard label="Rata-rata Keranjang" value={formatRupiah(daily?.transaction_count ? daily.total_revenue / daily.transaction_count : 0)} />
      </div>

      {/* Tren Grafik Berdasarkan Kolom Yang Diterima */}
      <Card title="Tren Grafik Omzet Pendapatan Bersih">
        {chartData.length ? <SalesLineChart data={chartData} /> : <p className="text-textmuted text-sm text-center py-10">Belum ada data berjalan di Spreadsheet</p>}
      </Card>

      {/* Arsip Riwayat Transaksi Toko */}
      <Card title="Arsip Ringkasan Transaksi Toko">
        <Table
          columns={[
            { key: 'transaction_id', label: 'ID Transaksi' },
            { key: 'date', label: 'Tanggal', render: (r) => formatTanggalPendek(r.date) },
            { key: 'yang_diterima', label: 'Uang Bersih Diterima', render: (r) => formatRupiah(r.yang_diterima || r.total || 0) },
            { key: 'payment_method', label: 'Jalur Pembayaran', render: (r) => {
               const method = String(r.payment_method).toLowerCase();
               const isQris = method.includes('qris') || method.includes('statis');
               return (
                 <span className={`px-2 py-1 text-xs rounded-full ${isQris ? 'bg-blue-900/50 text-blue-300' : 'bg-green-900/50 text-green-300'}`}>
                   {r.payment_method}
                 </span>
               );
            }},
            { key: 'status', label: 'Status' }
          ]}
          rows={sales || []}
        />
      </Card>
    </div>
  );
}

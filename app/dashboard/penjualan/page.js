'use client';
import { useState, useMemo } from 'react';
import { useData } from '@/hooks/useData';
import { api } from '@/lib/api';
import Card, { MetricCard } from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import SalesLineChart from '@/components/charts/SalesLineChart';
import { formatRupiah, formatTanggalPendek } from '@/lib/utils';

export default function PenjualanPage() {
  const [period, setPeriod] = useState('7');
  const [showCalendar, setShowCalendar] = useState(false);
  const [customRange, setCustomDates] = useState({ start: '', end: '' });
  const [activeCustomRange, setActiveCustomRange] = useState({ start: null, end: null });

  const getYYYYMMDD = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const dateRangeStr = useMemo(() => {
    const now = new Date();
    const end = getYYYYMMDD(now);
    const start = new Date();
    if (period === 'today') { /* today */ }
    else if (period === '7') { start.setDate(now.getDate() - 6); }
    else if (period === '14') { start.setDate(now.getDate() - 13); }
    else if (period === '30') { start.setDate(now.getDate() - 29); }
    else if (period === 'custom' && activeCustomRange.start) {
      return { start: activeCustomRange.start, end: activeCustomRange.end };
    }
    return { start: getYYYYMMDD(start), end };
  }, [period, activeCustomRange]);

  const { data: sales, loading } = useData(() => api.getSales({
    startDate: dateRangeStr.start,
    endDate: dateRangeStr.end
  }), [dateRangeStr]);

  const handleCustomApply = () => {
    if (customRange.start && customRange.end) {
      setActiveCustomRange({ start: customRange.start, end: customRange.end });
      setPeriod('custom');
      setShowCalendar(false);
    }
  };

  // 🔥 PEMISAHAN: Cash/Tunai (Revenue) vs QRIS (metode bayar terpisah, bukan revenue kedua)
  const cashSales = (sales || []).filter((s) => !s.is_qris);
  const qrisSales = (sales || []).filter((s) => s.is_qris);

  const totalOmzet = cashSales.reduce((sum, s) => sum + Number(s.yang_diterima || s.total || 0), 0);
  const volumeTransaksi = cashSales.length;
  const rataRata = volumeTransaksi > 0 ? (totalOmzet / volumeTransaksi) : 0;

  const qrisGross = qrisSales.reduce((sum, s) => sum + Number(s.total || 0), 0);
  const qrisMdr = qrisSales.reduce((sum, s) => sum + Number(s.mdr || 0), 0);
  const qrisNet = qrisSales.reduce((sum, s) => sum + Number(s.yang_diterima || 0), 0);

  // DATA GRAFIK (Hanya Kasir Tunai — Revenue murni)
  const chartData = useMemo(() => {
    const grouped = {};
    cashSales.forEach((s) => {
      const dateStr = formatTanggalPendek(s.date);
      grouped[dateStr] = (grouped[dateStr] || 0) + Number(s.yang_diterima || s.total || 0);
    });
    return Object.keys(grouped).map((date) => ({ label: date, revenue: grouped[date] })).reverse();
  }, [cashSales]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Brankas Data Penjualan</h1>
          <p className="text-textmuted text-sm">Pusat pemantauan omzet riil dan ringkasan transaksi toko</p>
        </div>

        <div className="flex bg-surface2 p-1 rounded-lg gap-1 border border-border/50 relative items-center">
          {[
            { id: '30', label: '30 Hari' },
            { id: '14', label: '14 Hari' },
            { id: '7', label: '7 Hari' },
            { id: 'today', label: 'Hari Ini' }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setPeriod(btn.id)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                period === btn.id ? 'bg-primary text-white shadow-md' : 'text-textmuted hover:bg-surface hover:text-text'
              }`}
            >
              {btn.label}
            </button>
          ))}
          <div className="relative border-l border-border/30 ml-1 pl-1">
            <button onClick={() => setShowCalendar(!showCalendar)} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${period === 'custom' ? 'bg-primary text-white' : 'text-textmuted hover:bg-surface'}`}>
              📅 Kustom
            </button>
            {showCalendar && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-surface border border-border rounded-xl shadow-2xl p-4 z-50 text-left">
                <div className="space-y-3">
                  <input type="date" value={customRange.start} onChange={(e) => setCustomDates({ ...customRange, start: e.target.value })} className="w-full bg-white border border-border/50 rounded p-2 text-xs text-black" />
                  <input type="date" value={customRange.end} onChange={(e) => setCustomDates({ ...customRange, end: e.target.value })} className="w-full bg-white border border-border/50 rounded p-2 text-xs text-black" />
                  <button onClick={handleCustomApply} className="w-full bg-primary text-white text-xs font-bold py-2 rounded">Terapkan</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ringkasan Revenue (MURNI, tanpa QRIS) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard label="Omzet (Tunai)" value={formatRupiah(totalOmzet)} />
        <MetricCard label="Volume Transaksi" value={volumeTransaksi} />
        <MetricCard label="Rata-rata Penjualan" value={formatRupiah(rataRata)} />
      </div>

      {/* 🔥 KARTU QRIS TERPISAH: bukan revenue, murni monitor metode bayar */}
      <div className="bg-surface2 border border-border/50 rounded-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">📱</span>
          <h3 className="text-sm font-bold text-textmuted uppercase tracking-wider">QRIS (Metode Pembayaran Terpisah)</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-background/40 rounded-lg p-3">
            <p className="text-xs text-textmuted mb-1">Total Transaksi</p>
            <p className="text-lg font-bold">{formatRupiah(qrisGross)}</p>
          </div>
          <div className="bg-background/40 rounded-lg p-3">
            <p className="text-xs text-textmuted mb-1">Biaya Admin (MDR)</p>
            <p className="text-lg font-bold text-danger">-{formatRupiah(qrisMdr)}</p>
          </div>
          <div className="bg-background/40 rounded-lg p-3">
            <p className="text-xs text-textmuted mb-1">Diterima Bersih</p>
            <p className="text-lg font-bold text-success">{formatRupiah(qrisNet)}</p>
          </div>
        </div>
      </div>

      <Card title="Tren Grafik Omzet (Tunai)">
        {chartData.length ? <SalesLineChart data={chartData} /> : <p className="text-textmuted text-sm text-center py-10">Data tidak tersedia untuk rentang ini</p>}
      </Card>

      <Card title="Arsip Ringkasan Transaksi Toko">
        {loading ? <p className="text-center py-6 text-sm text-textmuted">Memuat data transaksi...</p> : (
          <Table
            columns={[
              { key: 'transaction_id', label: 'ID Transaksi' },
              { key: 'date', label: 'Tanggal', render: (r) => formatTanggalPendek(r.date) },
              { key: 'yang_diterima', label: 'Uang Bersih Diterima', render: (r) => formatRupiah(r.yang_diterima || r.total || 0) },
              { key: 'payment_method', label: 'Jalur Pembayaran', render: (r) => {
                 const isQris = r.is_qris;
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
        )}
      </Card>
    </div>
  );
}

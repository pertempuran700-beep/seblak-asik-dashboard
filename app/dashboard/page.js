'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { api } from '@/lib/api';
import Card, { MetricCard } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import SalesBarChart from '@/components/charts/SalesBarChart';
import ProductDonutChart from '@/components/charts/ProductDonutChart';
import PaymentMethodChart from '@/components/charts/PaymentMethodChart';
import { formatRupiah, pctChangeLabel, currentMonthYear } from '@/lib/utils';

// Helper Format Tanggal
function getYYYYMMDD(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateRangeStr(type) {
  const now = new Date();
  const end = getYYYYMMDD(now);
  const start = new Date();
  if (type === '7') start.setDate(now.getDate() - 6);
  if (type === '14') start.setDate(now.getDate() - 13);
  if (type === '30') start.setDate(now.getDate() - 29);
  return { start: getYYYYMMDD(start), end };
}

export default function OverviewPage() {
  const { user } = useAuth();
  const { month, year } = currentMonthYear();

  // STATE UNTUK FILTER KALENDER INTERAKTIF
  const [filterType, setFilterType] = useState('30'); // 'today', '7', '14', '30', 'custom'
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [showCalendar, setShowCalendar] = useState(false);
  const [activeDateRange, setActiveDateRange] = useState(getDateRangeStr('30'));

  useEffect(() => {
    if (filterType !== 'custom') {
      setActiveDateRange(getDateRangeStr(filterType));
    }
  }, [filterType]);

  const handleCustomApply = () => {
    if (customDates.start && customDates.end) {
      setFilterType('custom');
      setActiveDateRange({ start: customDates.start, end: customDates.end });
      setShowCalendar(false);
    }
  };

  // 1. DATA DINAMIS (QRIS & PERFORMA PRODUK BERDASARKAN RENTANG TANGGAL)
  const { data: dashboardData } = useData(
    () => api.getDashboardSummary(activeDateRange.start, activeDateRange.end),
    [activeDateRange.start, activeDateRange.end]
  );

  // 2. DATA STATIS BAWAAN SISTEM ASLI (JANGAN DIHAPUS)
  const { data: daily } = useData(() => api.getDailySummary(), []);
  const { data: monthly } = useData(() => api.getMonthlySummary(month, year), [month, year]);
  const { data: stock } = useData(() => api.getStockLevels(), []);
  
  const isOwnerOrAdmin = user?.role === 'owner' || user?.role === 'admin';
  const { data: metrics } = useData(
    () => (isOwnerOrAdmin ? api.getFinancialMetrics(`${year}-${String(month).padStart(2, '0')}`) : Promise.resolve(null)),
    [isOwnerOrAdmin, month, year]
  );

  const lowStock = (stock || []).filter((p) => p.level_status !== 'OK').slice(0, 5);
  
  // MENGAMBIL DATA PRODUK TERLARIS DARI API YANG SUDAH TERSINKRONISASI TANGGAL
  const dynamicTopProducts = dashboardData?.product_performance?.slice(0, 6) || [];

  const paymentData = daily?.by_payment_method
    ? Object.entries(daily.by_payment_method).map(([name, value]) => ({
        name,
        value: daily.total_revenue ? Math.round((value / daily.total_revenue) * 100) : 0,
      }))
    : [];

  return (
    <div className="space-y-6 pb-10">
      
      {/* 🔹 HEADER & TOOLBAR FILTER KALENDER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Halo, {user?.full_name?.split(' ')[0]} 👋</h1>
          <p className="text-textmuted text-sm">Ringkasan operasional Seblak Asik</p>
        </div>

        <div className="flex items-center bg-surface border border-border/50 p-1 rounded-lg self-start md:self-auto relative">
          {[
            { id: '30', label: '30 Hari' },
            { id: '14', label: '14 Hari' },
            { id: '7', label: '7 Hari' },
            { id: 'today', label: 'Hari Ini' }
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilterType(btn.id)}
              className={`px-3 py-1.5 text-xs md:text-sm rounded-md transition-colors ${
                filterType === btn.id ? 'bg-primary text-white shadow' : 'text-textmuted hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
          
          {/* IKON KALENDER KUSTOM */}
          <div className="relative border-l border-border/50 ml-1 pl-1">
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className={`px-3 py-1.5 text-xs md:text-sm rounded-md flex items-center gap-1 transition-colors ${
                filterType === 'custom' ? 'bg-primary text-white shadow' : 'text-textmuted hover:text-white'
              }`}
            >
              📅 Custom
            </button>

            {/* POPUP DROPDOWN KALENDER */}
            {showCalendar && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-surface2 border border-border/50 rounded-xl shadow-xl p-4 z-50">
                <p className="text-sm font-semibold mb-3">Pilih Rentang Tanggal</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-textmuted mb-1 block">Tanggal Mulai</label>
                    <input 
                      type="date" 
                      value={customDates.start} 
                      onChange={(e) => setCustomDates({ ...customDates, start: e.target.value })}
                      className="w-full bg-background border border-border/50 rounded-md p-2 text-sm text-text focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-textmuted mb-1 block">Tanggal Berakhir</label>
                    <input 
                      type="date" 
                      value={customDates.end} 
                      onChange={(e) => setCustomDates({ ...customDates, end: e.target.value })}
                      className="w-full bg-background border border-border/50 rounded-md p-2 text-sm text-text focus:outline-none focus:border-primary"
                    />
                  </div>
                  <button 
                    onClick={handleCustomApply}
                    className="w-full bg-primary hover:bg-primary/90 text-white text-sm font-semibold py-2 rounded-md mt-2 transition-colors"
                  >
                    Terapkan Rentang
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🔹 BUBBLE METRIK KHUSUS: PEMASUKAN QRIS BERSIH */}
      <div className="bg-surface2 border border-border/50 rounded-card p-5 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="text-5xl">📱</div>
          <div>
            <h3 className="text-sm font-semibold text-textmuted uppercase tracking-wider">Total Pemasukan QRIS Bersih</h3>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-3xl font-bold text-success">
                {dashboardData ? formatRupiah(dashboardData.qris.net) : 'Memuat...'}
              </p>
              <span className="text-xs font-medium text-textmuted bg-background px-2 py-0.5 rounded-full border border-border/30">
                {filterType === 'today' ? 'Hari Ini' : filterType === 'custom' ? 'Custom' : `${filterType} Hari`}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end text-sm relative z-10 bg-background/50 p-3 rounded-lg border border-border/30 w-full md:w-auto">
          <div className="flex justify-between w-full gap-6 border-b border-border/30 pb-1 mb-1">
            <span className="text-textmuted">Kotor:</span>
            <span className="font-semibold text-text">{dashboardData ? formatRupiah(dashboardData.qris.gross) : 'Rp 0'}</span>
          </div>
          <div className="flex justify-between w-full gap-6">
            <span className="text-textmuted">Potongan Admin (2%):</span>
            <span className="font-semibold text-danger">-{dashboardData ? formatRupiah(dashboardData.qris.mdr) : 'Rp 0'}</span>
          </div>
        </div>
      </div>

      {/* 🔹 GRID 4 KOTAK METRIK UTAMA (BAWAAN ASLI ANDA) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Revenue Hari Ini" value={formatRupiah(daily?.total_revenue || 0)} change={daily ? `${daily.transaction_count} transaksi` : ''} />
        {metrics && (
          <>
            <MetricCard
              label="Net Profit Bulan Ini"
              value={formatRupiah(metrics.current.net_profit)}
              change={pctChangeLabel(metrics.changes.profit_pct)}
              changeType={metrics.changes.profit_pct >= 0 ? 'up' : 'down'}
            />
            <MetricCard
              label="COGS Bulan Ini"
              value={formatRupiah(metrics.current.cogs)}
              change={pctChangeLabel(metrics.changes.cogs_pct)}
              changeType={metrics.changes.cogs_pct <= 0 ? 'up' : 'down'}
            />
            <MetricCard
              label="OPEX Bulan Ini"
              value={formatRupiah(metrics.current.opex)}
              change={pctChangeLabel(metrics.changes.opex_pct)}
              changeType={metrics.changes.opex_pct <= 0 ? 'up' : 'down'}
            />
          </>
        )}
        {!metrics && (
          <MetricCard label="Revenue Bulan Ini" value={formatRupiah(monthly?.total_revenue || 0)} change={monthly ? `${monthly.transaction_count} transaksi` : ''} />
        )}
      </div>

      {/* 🔹 GRAFIK PRODUK DINAMIS & METODE PEMBAYARAN */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title={`Topping Terlaris (${filterType === 'today' ? 'Hari Ini' : filterType === 'custom' ? 'Custom' : filterType + ' Hari'})`}>
          {dynamicTopProducts.length ? (
            <ProductDonutChart data={dynamicTopProducts} />
          ) : (
            <p className="text-textmuted text-sm text-center py-10">Belum ada data penjualan di rentang waktu ini</p>
          )}
        </Card>

        <Card title="Pembayaran Hari Ini">
          {paymentData.length ? (
            <PaymentMethodChart data={paymentData} />
          ) : (
            <p className="text-textmuted text-sm text-center py-10">Belum ada transaksi hari ini</p>
          )}
        </Card>
      </div>

      {/* 🔹 TABEL STOK RENDAH */}
      <Card title="⚠️ Stok Rendah">
        {lowStock.length === 0 ? (
          <p className="text-textmuted text-sm">Semua stok dalam kondisi aman ✅</p>
        ) : (
          <div className="space-y-2">
            {lowStock.map((p) => (
              <div key={p.product_id} className="flex items-center justify-between text-sm border-b border-border/20 pb-2 last:border-0">
                <span className="font-medium text-text">{p.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-textmuted">{p.current_stock} {p.unit} <span className="text-xs opacity-70">(min: {p.min_stock})</span></span>
                  <Badge variant={p.level_status === 'Critical' ? 'danger' : 'warning'}>{p.level_status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

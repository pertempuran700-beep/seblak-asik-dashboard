'use client';
import { useState, useMemo } from 'react';
import { useData } from '@/hooks/useData';
import { api } from '@/lib/api';
import Card from '@/components/ui/Card';
import { formatRupiah, formatTanggalPendek } from '@/lib/utils';
import SalesLineChart from '@/components/charts/SalesLineChart';

export default function OverviewDashboard() {
  const [period, setPeriod] = useState('30');
  const [showCalendar, setShowCalendar] = useState(false);
  const [customRange, setCustomDates] = useState({ start: '', end: '' });
  const [activeCustomRange, setActiveCustomRange] = useState({ start: null, end: null });

  const { data: settings } = useData(() => api.getSystemSettings(), []);
  const { data: sales } = useData(() => api.getSales({}), []);
  const { data: products } = useData(() => api.listProducts(), []);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const { data: metrics } = useData(() => api.getFinancialMetrics(`${currentYear}-${String(currentMonth).padStart(2, '0')}`), []);

  // HELPER: Format tanggal untuk API (YYYY-MM-DD)
  const getYYYYMMDD = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 1. SETUP TANGGAL UNTUK API DASHBOARD (Wajib untuk Laporan Produk)
  const dateRangeStr = useMemo(() => {
    const now = new Date();
    const end = getYYYYMMDD(now);
    const start = new Date();
    if (period === 'today') { /* start = today */ }
    else if (period === '7') { start.setDate(now.getDate() - 6); }
    else if (period === '14') { start.setDate(now.getDate() - 13); }
    else if (period === '30') { start.setDate(now.getDate() - 29); }
    else if (period === 'all') { return { start: '2024-01-01', end }; }
    else if (period === 'custom' && activeCustomRange.start) {
      return { start: activeCustomRange.start, end: activeCustomRange.end };
    }
    return { start: getYYYYMMDD(start), end };
  }, [period, activeCustomRange]);

  // MENGAMBIL DATA PRODUK DARI API (Karena getSales tidak membawa data items)
  const { data: dashboardData } = useData(
    () => api.getDashboardSummary(dateRangeStr.start, dateRangeStr.end),
    [dateRangeStr.start, dateRangeStr.end]
  );

  // 2. FILTER TRANSAKSI PENJUALAN
  const filteredSales = useMemo(() => {
    if (!sales) return [];
    const now = new Date();

    return sales.filter(s => {
      const saleDate = new Date(s.date);

      if (period === 'custom' && activeCustomRange.start && activeCustomRange.end) {
        const start = new Date(activeCustomRange.start);
        start.setHours(0, 0, 0, 0);
        const end = new Date(activeCustomRange.end);
        end.setHours(23, 59, 59, 999);
        return saleDate >= start && saleDate <= end;
      }

      const diffTime = Math.abs(now - saleDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (period === 'today') return diffDays <= 1;
      if (period === '7') return diffDays <= 7;
      if (period === '14') return diffDays <= 14;
      if (period === '30') return diffDays <= 30;
      return true;
    });
  }, [sales, period, activeCustomRange]);

  // 3. PERBAIKAN BUG QRIS & REVENUE MURNI
  const actualRevenue = useMemo(() => {
    return filteredSales
      .filter(s => {
        const method = String(s.payment_method || '').toLowerCase();
        return !method.includes('qris') && !method.includes('transfer') && !method.includes('bca') && !method.includes('seabank');
      })
      .reduce((sum, s) => sum + Number(s.yang_diterima || s.total || 0), 0);
  }, [filteredSales]);

  const qrisMetrics = useMemo(() => {
    const adminFeePct = Number(settings?.admin_fee_percent || 2);
    const qrisTransactions = filteredSales.filter(s => {
        const method = String(s.payment_method || '').toLowerCase();
        return method.includes('qris') || method.includes('transfer') || method.includes('bca') || method.includes('seabank');
    });

    const gross = qrisTransactions.reduce((sum, s) => sum + Number(s.total || s.yang_diterima || 0), 0);
    const mdr = Math.round((gross * adminFeePct) / 100);
    const net = gross - mdr;

    return { gross, mdr, net };
  }, [filteredSales, settings]);

  // 4. PERBAIKAN BUG LAPORAN PRODUK
  const { dynamicTopProducts, dynamicWorstProducts } = useMemo(() => {
    if (!dashboardData?.product_performance || !products) return { dynamicTopProducts: [], dynamicWorstProducts: [] };

    const perf = dashboardData.product_performance;
    const top10 = perf.slice(0, 10);

    const perfMap = {};
    perf.forEach(p => { perfMap[p.name] = p.qty; });

    const allActiveProducts = products
      .filter(p => p.status !== 'Discontinued')
      .map(p => ({
        name: p.name,
        qty: perfMap[p.name] || 0
      }))
      .sort((a, b) => a.qty - b.qty);

    const bottom5 = allActiveProducts.slice(0, 5);

    return { dynamicTopProducts: top10, dynamicWorstProducts: bottom5 };
  }, [dashboardData, products]);

  // 5. KALKULASI TARGET & METRIK
  const actualGPM = metrics?.current?.gross_margin_pct || 0;
  const actualEBITDA = metrics?.current?.ebitda || 0;
  const actualNPM = metrics?.current?.revenue > 0 ? (metrics.current.net_profit / metrics.current.revenue) * 100 : 0;

  const targetMonthlyRevenue = Number(settings?.target_revenue_monthly || 50000000);
  const targetGPM = Number(settings?.target_gpm_percent || 65);
  const targetMonthlyEBITDA = Number(settings?.target_ebitda_monthly || 15000000);
  const targetNPM = Number(settings?.target_npm_percent || 20);

  const timeDivider = useMemo(() => {
    if (period === 'today') return 1;
    if (period === '7') return 7;
    if (period === '14') return 14;
    if (period === '30') return 30;
    if (period === 'custom' && activeCustomRange.start && activeCustomRange.end) {
      const s = new Date(activeCustomRange.start);
      const e = new Date(activeCustomRange.end);
      return Math.max(1, Math.ceil(Math.abs(e - s) / (1000 * 60 * 60 * 24)) + 1);
    }
    return 30;
  }, [period, activeCustomRange]);

  const targetRevenue = (targetMonthlyRevenue / 30) * timeDivider;
  const targetEBITDA = (targetMonthlyEBITDA / 30) * timeDivider;

  const pctRevenue = Math.min((actualRevenue / targetRevenue) * 100, 100) || 0;
  const pctGPM = Math.min((actualGPM / targetGPM) * 100, 100) || 0;
  const pctEBITDA = Math.min((actualEBITDA / targetMonthlyEBITDA) * 100, 100) || 0;
  const pctNPM = Math.min((actualNPM / targetNPM) * 100, 100) || 0;

  const getProgressColor = (pct) => {
    if (pct >= 85) return 'bg-success';
    if (pct >= 50) return 'bg-warning';
    return 'bg-danger';
  };

  const chartData = useMemo(() => {
    const grouped = {};
    filteredSales.forEach(s => {
      const dateStr = formatTanggalPendek(s.date);
      grouped[dateStr] = (grouped[dateStr] || 0) + Number(s.yang_diterima || 0);
    });
    return Object.keys(grouped).map(date => ({ label: date, revenue: grouped[date] })).reverse();
  }, [filteredSales]);

  const criticalStock = (products || []).filter(p => p.current_stock <= p.min_stock);

  const handleCustomApply = () => {
    if (customRange.start && customRange.end) {
      setActiveCustomRange({ start: customRange.start, end: customRange.end });
      setPeriod('custom');
      setShowCalendar(false);
    }
  };

  const ProgressBar = ({ label, actualText, pct, targetText }) => (
    <div className="bg-surface2 p-4 rounded-card border border-border/50">
      <h3 className="text-textmuted text-sm font-semibold mb-1">{label}</h3>
      <p className="text-2xl font-bold text-text mb-2">{actualText}</p>
      <div className="w-full bg-background rounded-full h-2.5 mb-1">
        <div className={`h-2.5 rounded-full ${getProgressColor(pct)}`} style={{ width: `${pct}%` }}></div>
      </div>
      <p className="text-xs text-textmuted flex justify-between">
        <span>{pct.toFixed(1)}% Tercapai</span>
        <span>Target: {targetText}</span>
      </p>
    </div>
  );

  // Helper display date aman
  const displayCustomDate = (dateStr) => {
     if(!dateStr) return '';
     try {
         return formatTanggalPendek(dateStr);
     } catch(e) {
         return dateStr;
     }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">🏠 Ringkasan Eksekutif</h1>
          <p className="text-sm text-textmuted">Pusat kendali performa bisnis Seblak Asik</p>
        </div>
        
        <div className="flex flex-col items-end gap-2 z-50">
          <div className="flex bg-surface2 p-1 rounded-lg gap-1 border border-border/50 relative items-center">
            {[
              { id: 'all', label: 'Semua' },
              { id: '30', label: '30 Hari' },
              { id: '14', label: '14 Hari' },
              { id: '7', label: '7 Hari' },
              { id: 'today', label: 'Hari Ini' }
            ].map(btn => (
              <button
                key={btn.id}
                onClick={() => setPeriod(btn.id)}
                className={`px-4 py-1.5 text-xs md:text-sm font-semibold rounded-md transition-colors ${
                  period === btn.id ? 'bg-primary text-white shadow-md' : 'text-textmuted hover:bg-surface hover:text-text'
                }`}
              >
                {btn.label}
              </button>
            ))}

            <div className="relative border-l border-border/30 ml-1 pl-1">
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className={`px-3 py-1.5 text-xs md:text-sm font-semibold rounded-md transition-colors flex items-center gap-1 ${
                  period === 'custom' ? 'bg-primary text-white shadow-md' : 'text-textmuted hover:bg-surface hover:text-text'
                }`}
              >
                📅 {period === 'custom' ? 'Kustom' : 'Custom'}
              </button>

              {showCalendar && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-surface border border-border rounded-xl shadow-2xl p-4 z-50 text-left">
                  <h4 className="text-sm font-bold text-white mb-2">Rentang Kustom</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-textmuted block mb-1">Mulai Tanggal</label>
                      <input 
                        type="date" 
                        value={customRange.start}
                        onChange={(e) => setCustomDates({ ...customRange, start: e.target.value })}
                        className="w-full bg-background border border-border/50 rounded p-2 text-xs text-white focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-textmuted block mb-1">Sampai Tanggal</label>
                      <input 
                        type="date" 
                        value={customRange.end}
                        onChange={(e) => setCustomDates({ ...customRange, end: e.target.value })}
                        className="w-full bg-background border border-border/50 rounded p-2 text-xs text-white focus:outline-none focus:border-primary"
                      />
                    </div>
                    <button
                      onClick={handleCustomApply}
                      className="w-full bg-primary hover:bg-primary/90 text-white text-xs font-bold py-2 rounded transition-colors"
                    >
                      Terapkan Rentang
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {period === 'custom' && activeCustomRange.start && (
            <div className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Menampilkan data: {displayCustomDate(activeCustomRange.start)} - {displayCustomDate(activeCustomRange.end)}
            </div>
          )}
        </div>
      </div>

      <div className="bg-surface2 border border-border/50 rounded-card p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-inner">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📱</span>
          <div>
            <h4 className="text-xs font-bold text-textmuted uppercase tracking-wider">Total Bersih Pemasukan QRIS</h4>
            <p className="text-2xl font-black text-success mt-0.5">{formatRupiah(qrisMetrics.net)}</p>
          </div>
        </div>
        <div className="text-xs text-textmuted bg-background/40 border border-border/30 rounded p-2 w-full sm:w-auto flex justify-between sm:gap-6">
          <span>Kotor: <strong>{formatRupiah(qrisMetrics.gross)}</strong></span>
          <span className="border-l border-border/30 pl-4">Potongan Admin ({settings?.admin_fee_percent || 2}%): <strong className="text-danger">-{formatRupiah(qrisMetrics.mdr)}</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ProgressBar 
          label="💰 REVENUE (Kasir Tunai)" 
          actualText={formatRupiah(actualRevenue)} 
          pct={pctRevenue} 
          targetText={formatRupiah(targetRevenue)} 
        />
        <ProgressBar 
          label="📊 GPM (Gross Margin)" 
          actualText={`${actualGPM.toFixed(1)}%`} 
          pct={pctGPM} 
          targetText={`${targetGPM}%`} 
        />
        <ProgressBar 
          label="☕ EBITDA" 
          actualText={formatRupiah(actualEBITDA)} 
          pct={pctEBITDA} 
          targetText={formatRupiah(targetEBITDA)} 
        />
        <ProgressBar 
          label="💵 NPM (Net Margin)" 
          actualText={`${actualNPM.toFixed(1)}%`} 
          pct={pctNPM} 
          targetText={`${targetNPM}%`} 
        />
      </div>

      <Card title="📈 Pergerakan Total Penjualan Harian">
        {chartData.length > 0 ? (
          <div className="h-64">
            <SalesLineChart data={chartData} />
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-textmuted">Belum ada data untuk periode ini</div>
        )}
      </Card>

      <Card title="📋 Laporan Performa Kuantitas Produk Terjual">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface2 p-4 rounded-lg border border-border/50">
            <h3 className="font-bold text-success mb-3 flex items-center gap-2">🔥 Produk Teratas (Best Seller)</h3>
            <ul className="space-y-2">
              {dynamicTopProducts.map((p, i) => (
                <li key={i} className="flex justify-between items-center text-sm border-b border-border/30 pb-1">
                  <span className="text-text">{i + 1}. {p.name}</span>
                  <span className="font-semibold">{p.qty} Porsi</span>
                </li>
              ))}
              {dynamicTopProducts.length === 0 && <p className="text-xs text-textmuted">Tidak ada penjualan.</p>}
            </ul>
          </div>

          <div className="bg-surface2 p-4 rounded-lg border border-border/50">
            <h3 className="font-bold text-info mb-3 flex items-center gap-2">🧊 Produk Tersepi (Worst Seller)</h3>
            <ul className="space-y-2">
              {dynamicWorstProducts.map((p, i) => (
                <li key={i} className="flex justify-between items-center text-sm border-b border-border/30 pb-1">
                  <span className="text-text truncate w-48">{p.name}</span>
                  <span className={`font-semibold ${p.qty === 0 ? 'text-danger' : 'text-warning'}`}>{p.qty} Porsi</span>
                </li>
              ))}
              {dynamicWorstProducts.length === 0 && <p className="text-xs text-textmuted">Data belum tersedia.</p>}
            </ul>
          </div>
        </div>
      </Card>

      <Card title="⚠️ Pemantau Stok Kritis Bahan Baku" className="border-l-4 border-l-danger">
        <div className="space-y-3">
          {criticalStock.length > 0 ? (
            criticalStock.map((p, i) => (
              <div key={i} className="flex justify-between items-center bg-danger/10 p-3 rounded border border-danger/20">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{p.current_stock <= 0 ? '🔴' : '🟡'}</span>
                  <div>
                    <p className="font-bold text-sm">{p.name}</p>
                    <p className="text-xs text-textmuted">Batas Minimum: {p.min_stock} {p.sell_unit}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-danger text-sm">Sisa: {p.current_stock} {p.sell_unit}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-danger mt-1">
                    {p.current_stock <= 0 ? 'Critical' : 'Low'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 bg-success/10 text-success border border-success/20 rounded-lg text-center font-semibold text-sm">
              ✅ Semua stok bahan baku berada dalam batas aman.
            </div>
          )}
        </div>
      </Card>

    </div>
  );
}

'use client';
import { useState, useMemo } from 'react';
import { useData } from '@/hooks/useData';
import { api } from '@/lib/api';
import Card from '@/components/ui/Card';
import { formatRupiah, formatTanggalPendek } from '@/lib/utils';
import SalesLineChart from '@/components/charts/SalesLineChart';

export default function OverviewDashboard() {
  const [period, setPeriod] = useState('7');
  const [showCalendar, setShowCalendar] = useState(false);
  const [customRange, setCustomDates] = useState({ start: '', end: '' });
  const [activeCustomRange, setActiveCustomRange] = useState({ start: null, end: null });

  const { data: products } = useData(() => api.listProducts(), []);

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

  const { data: dashboardData } = useData(
    () => api.getDashboardSummary(dateRangeStr.start, dateRangeStr.end),
    [dateRangeStr.start, dateRangeStr.end]
  );
  
  const { data: rawSales } = useData(() => api.getSales({ 
    startDate: dateRangeStr.start, 
    endDate: dateRangeStr.end 
  }), [dateRangeStr]);

  // Kalkulator Pembagi Hari untuk Target Pro-rata
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

  // Kalkulasi Keuangan
  const fin = dashboardData?.finance_real || { cogs: 0, opex_var: 0, opex_fixed_prorated: 0, tax_dep_prorated: 0, admin_fee: 0 };
  const revenue = dashboardData?.total_revenue || 0;
  
  const grossProfit = revenue - fin.cogs;
  const gpm = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  
  const ebitda = grossProfit - fin.opex_var - fin.opex_fixed_prorated - fin.admin_fee;
  const netProfit = ebitda - fin.tax_dep_prorated;
  const npm = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  // Target Keuangan (Ditarik dari Backend & Diproporsikan sesuai hari)
  const tRev = dashboardData?.targets?.revenue || 0;
  const tEbitda = dashboardData?.targets?.ebitda || 0;
  const targetGPM = dashboardData?.targets?.gpm || 0;
  const targetNPM = dashboardData?.targets?.npm || 0;

  const targetRevenueProrated = (tRev / 30) * timeDivider;
  const targetEbitdaProrated = (tEbitda / 30) * timeDivider;

  // Laporan Produk
  const dynamicTopProducts = dashboardData?.product_performance?.slice(0, 10) || [];
  const dynamicWorstProducts = dashboardData?.product_performance ? [...dashboardData.product_performance].reverse().slice(0, 5) : [];

// Data Grafik (Hanya Kasir Tunai)
  const chartData = useMemo(() => {
    if (!rawSales) return [];
    const grouped = {};
    // Tambahkan filter !s.is_qris sebelum forEach
    rawSales.filter(s => !s.is_qris).forEach(s => {
      const dateStr = formatTanggalPendek(s.date);
      grouped[dateStr] = (grouped[dateStr] || 0) + Number(s.yang_diterima || s.total || 0);
    });
    return Object.keys(grouped).map(date => ({ label: date, revenue: grouped[date] })).reverse();
  }, [rawSales]);

  const criticalStock = (products || []).filter(p => p.current_stock <= p.min_stock);

  const handleCustomApply = () => {
    if (customRange.start && customRange.end) {
      setActiveCustomRange({ start: customRange.start, end: customRange.end });
      setPeriod('custom');
      setShowCalendar(false);
    }
  };

  const displayCustomDate = (dateStr) => {
    if(!dateStr) return '';
    try { return formatTanggalPendek(dateStr); } 
    catch(e) { return dateStr; }
  };

  // Komponen Card dengan Indikator Target
  const FinancialCard = ({ label, amount, targetAmount, isPercentTarget, pct, pctLabel, colorClass }) => (
    <div className={`bg-surface2 p-4 rounded-card border border-white/[0.08] hover:border-${colorClass.split('-')[1]}/50 transition-all`}>
      <h3 className="text-textmuted text-sm font-semibold mb-1">{label}</h3>
      <p className={`text-2xl font-bold ${colorClass}`}>{amount}</p>
      <p className="text-xs font-medium text-textmuted mt-1 opacity-80">
        Target: <span className="text-white">{isPercentTarget ? `${targetAmount}%` : formatRupiah(targetAmount)}</span>
      </p>
      <div className="mt-2 pt-2 border-t border-white/[0.05] flex justify-between items-center">
        <span className="text-xs text-textmuted">{pctLabel}</span>
        <span className={`text-xs font-bold px-2 py-1 rounded bg-background ${colorClass}`}>{pct.toFixed(1)}%</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      
      {/* HEADER & FILTER TANGGAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">🏠 Ringkasan Eksekutif</h1>
          <p className="text-sm text-textmuted">Kalkulasi Keuangan Real-time Seblak Asik</p>
        </div>
        
        <div className="flex flex-col items-end gap-2 z-50">
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
                📅 Kustom
              </button>
              {showCalendar && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-surface border border-border rounded-xl shadow-2xl p-4 z-50 text-left">
                  <h4 className="text-sm font-bold text-white mb-2">Rentang Kustom</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-textmuted block mb-1">Mulai Tanggal</label>
                      {/* FIX: Bg putih, text hitam agar terbaca jelas */}
                      <input type="date" value={customRange.start} onChange={(e) => setCustomDates({ ...customRange, start: e.target.value })} className="w-full bg-white border border-border/50 rounded p-2 text-xs text-black" />
                    </div>
                    <div>
                      <label className="text-xs text-textmuted block mb-1">Sampai Tanggal</label>
                      {/* FIX: Bg putih, text hitam agar terbaca jelas */}
                      <input type="date" value={customRange.end} onChange={(e) => setCustomDates({ ...customRange, end: e.target.value })} className="w-full bg-white border border-border/50 rounded p-2 text-xs text-black" />
                    </div>
                    <button onClick={handleCustomApply} className="w-full bg-primary hover:bg-primary/90 text-white text-xs font-bold py-2 rounded">Terapkan Rentang</button>
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

      {/* METRIK KEUANGAN REAL-TIME DENGAN TARGET */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FinancialCard 
           label="💰 REVENUE (Omzet Bersih)" 
           amount={formatRupiah(revenue)} 
           targetAmount={targetRevenueProrated}
           isPercentTarget={false}
           pct={targetRevenueProrated > 0 ? Math.min((revenue / targetRevenueProrated) * 100, 100) : 0} 
           pctLabel="Pencapaian Target" 
           colorClass="text-white" 
        />
        <FinancialCard 
           label="📊 GPM (Laba Kotor)" 
           amount={formatRupiah(grossProfit)} 
           targetAmount={targetGPM}
           isPercentTarget={true}
           pct={gpm} 
           pctLabel="Margin Kotor Riil" 
           colorClass="text-info" 
        />
        <FinancialCard 
           label="☕ EBITDA (Laba Operasional)" 
           amount={formatRupiah(ebitda)} 
           targetAmount={targetEbitdaProrated}
           isPercentTarget={false}
           pct={targetEbitdaProrated > 0 ? Math.min((ebitda / targetEbitdaProrated) * 100, 100) : 0} 
           pctLabel="Pencapaian Target" 
           colorClass="text-warning" 
        />
        <FinancialCard 
           label="💵 NPM (Laba Bersih)" 
           amount={formatRupiah(netProfit)} 
           targetAmount={targetNPM}
           isPercentTarget={true}
           pct={npm} 
           pctLabel="Margin Bersih Riil" 
           colorClass="text-success" 
        />
      </div>

      <div className="bg-surface2 border border-border/50 rounded-card p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-inner">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📱</span>
          <div>
            <h4 className="text-xs font-bold text-textmuted uppercase tracking-wider">Total Pemasukan QRIS</h4>
            <p className="text-2xl font-black text-success mt-0.5">{formatRupiah(dashboardData?.qris?.net || 0)}</p>
          </div>
        </div>
        <div className="text-xs text-textmuted bg-background/40 border border-border/30 rounded p-2 w-full sm:w-auto flex justify-between sm:gap-6">
          <span>Kotor: <strong>{formatRupiah(dashboardData?.qris?.gross || 0)}</strong></span>
          <span className="border-l border-border/30 pl-4">Potongan Admin: <strong className="text-danger">-{formatRupiah(dashboardData?.qris?.mdr || 0)}</strong></span>
        </div>
      </div>

      {/* GRAFIK */}
      <Card title="📈 Grafik Tren Omzet">
        {chartData.length > 0 ? (
          <div className="h-64"><SalesLineChart data={chartData} /></div>
        ) : (
          <div className="h-64 flex items-center justify-center text-textmuted">Belum ada data di rentang ini</div>
        )}
      </Card>

      {/* LAPORAN PERFORMA PRODUK (Detail dengan Unit & Rupiah) */}
      <Card title="📋 Laporan Performa Produk">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface2 p-4 rounded-lg border border-border/50">
            <h3 className="font-bold text-success mb-4 flex items-center gap-2">🔥 Best Seller (Teratas)</h3>
            <ul className="space-y-3">
              {dynamicTopProducts.map((p, i) => (
                <li key={i} className="flex justify-between items-center text-sm border-b border-border/30 pb-2">
                  <span className="text-text font-medium truncate pr-2 w-1/2">{i + 1}. {p.name}</span>
                  <div className="flex justify-end gap-3 w-1/2 text-right">
                    <span className="font-semibold text-textmuted w-16">{p.qty} Unit</span>
                    <span className="font-bold text-success w-24">{formatRupiah(p.total)}</span>
                  </div>
                </li>
              ))}
              {dynamicTopProducts.length === 0 && <p className="text-xs text-textmuted">Tidak ada penjualan.</p>}
            </ul>
          </div>
          <div className="bg-surface2 p-4 rounded-lg border border-border/50">
            <h3 className="font-bold text-danger mb-4 flex items-center gap-2">🧊 Worst Seller (Tersepi)</h3>
            <ul className="space-y-3">
              {dynamicWorstProducts.map((p, i) => (
                <li key={i} className="flex justify-between items-center text-sm border-b border-border/30 pb-2">
                  <span className="text-text font-medium truncate pr-2 w-1/2">{p.name}</span>
                  <div className="flex justify-end gap-3 w-1/2 text-right">
                    <span className={`font-semibold w-16 ${p.qty === 0 ? 'text-danger' : 'text-warning'}`}>{p.qty} Unit</span>
                    <span className="font-bold text-textmuted w-24">{formatRupiah(p.total)}</span>
                  </div>
                </li>
              ))}
              {dynamicWorstProducts.length === 0 && <p className="text-xs text-textmuted">Data belum tersedia.</p>}
            </ul>
          </div>
        </div>
      </Card>

      <Card title="⚠️ Warning Produk! (Stok Kritis)" className="border-l-4 border-l-danger">
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
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 bg-success/10 text-success border border-success/20 rounded-lg text-center font-semibold text-sm">
              ✅ Semua stok bahan baku aman.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

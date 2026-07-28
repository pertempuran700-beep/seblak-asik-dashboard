'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link'; // Menggunakan Router internal Next.js agar token auth tidak putus
import { useData } from '@/hooks/useData';
import { api } from '@/lib/api';
import Card from '@/components/ui/Card';
import { formatRupiah, formatTanggalPendek } from '@/lib/utils';
import SalesLineChart from '@/components/charts/SalesLineChart'; 

export default function OverviewDashboard() {
  // State untuk Filter Periode: 'today', '7', '14', '30', 'all'
  const [period, setPeriod] = useState('30'); 

  // Menarik Data dari API
  const { data: settings } = useData(() => api.getSystemSettings(), []);
  const { data: sales } = useData(() => api.getSales({}), []);
  const { data: products } = useData(() => api.listProducts(), []);
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const { data: metrics } = useData(() => api.getFinancialMetrics(`${currentYear}-${String(currentMonth).padStart(2, '0')}`), []);
  const { data: monthlySummary } = useData(() => api.getMonthlySummary(currentMonth, currentYear), []);

  // 1. FILTER DATA BERDASARKAN PERIODE WAKTU
  const filteredSales = useMemo(() => {
    if (!sales) return [];
    const now = new Date();
    return sales.filter(s => {
      const saleDate = new Date(s.date);
      const diffTime = Math.abs(now - saleDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (period === 'today') return diffDays <= 1;
      if (period === '7') return diffDays <= 7;
      if (period === '14') return diffDays <= 14;
      if (period === '30') return diffDays <= 30;
      return true;
    });
  }, [sales, period]);

  // 2. KALKULASI METRIK AKTUAL
  const actualRevenue = filteredSales.reduce((sum, s) => sum + Number(s.yang_diterima || 0), 0);
  const actualGPM = metrics?.current?.gross_margin_pct || 0; 
  const actualEBITDA = metrics?.current?.ebitda || 0;
  const actualNPM = metrics?.current?.revenue > 0 ? (metrics.current.net_profit / metrics.current.revenue) * 100 : 0;

  // 3. KALKULASI TARGET PROPORSIONAL
  const targetMonthlyRevenue = Number(settings?.target_revenue_monthly || 50000000);
  const targetGPM = Number(settings?.target_gpm_percent || 65);
  const targetMonthlyEBITDA = Number(settings?.target_ebitda_monthly || 15000000);
  const targetNPM = Number(settings?.target_npm_percent || 20);

  let timeDivider = 30;
  if (period === 'today') timeDivider = 1;
  if (period === '7') timeDivider = 7;
  if (period === '14') timeDivider = 14;
  if (period === 'all') timeDivider = 365;

  const targetRevenue = (targetMonthlyRevenue / 30) * timeDivider;

  // 4. PERSENTASE PENCAPAIAN
  const pctRevenue = Math.min((actualRevenue / targetRevenue) * 100, 100) || 0;
  const pctGPM = Math.min((actualGPM / targetGPM) * 100, 100) || 0;
  const pctEBITDA = Math.min((actualEBITDA / targetMonthlyEBITDA) * 100, 100) || 0;
  const pctNPM = Math.min((actualNPM / targetNPM) * 100, 100) || 0;

  const getProgressColor = (pct) => {
    if (pct >= 85) return 'bg-success';
    if (pct >= 50) return 'bg-warning';
    return 'bg-danger';
  };

  // 5. DATA GRAFIK
  const chartData = useMemo(() => {
    const grouped = {};
    filteredSales.forEach(s => {
      const dateStr = formatTanggalPendek(s.date);
      grouped[dateStr] = (grouped[dateStr] || 0) + Number(s.yang_diterima || 0);
    });
    return Object.keys(grouped).map(date => ({ label: date, revenue: grouped[date] })).reverse();
  }, [filteredSales]);

  const topProducts = monthlySummary?.top_products || [];
  const worstProducts = [...(products || [])].sort((a, b) => a.stock_out_total - b.stock_out_total).slice(0, 5);
  const criticalStock = (products || []).filter(p => p.current_stock <= p.min_stock);

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

  // LINK SIDEBAR DENGAN SISTEM ROUTING UTUH
  const sidebarLinks = [
    { label: 'Overview', icon: '🏠', active: true, href: '/dashboard' },
    { label: 'Penjualan', icon: '🛒', href: '/dashboard/penjualan' },
    { label: 'Stok', icon: '📦', href: '/dashboard/stok' },
    { label: 'Keuangan', icon: '💵', href: '/dashboard/keuangan' },
    { label: 'Karyawan', icon: '👥', href: '/dashboard/karyawan' },
    { label: 'Absensi', icon: '✅', href: '/dashboard/absensi' },
    { label: 'Vendor', icon: '🏬', href: '/dashboard/vendor' },
    { label: 'Hutang Piutang', icon: '💰', href: '/dashboard/apar' },
    { label: 'Share Holder', icon: '🤝', href: '/dashboard/shareholder' },
    { label: 'Promo', icon: '🏷️', href: '/dashboard/promo' },
    { label: 'Pengaturan', icon: '⚙️', href: '/dashboard/settings' },
  ];

  return (
    <div className="flex min-h-screen bg-background text-text">
      
      {/* KIRI: SIDEBAR NAVIGASI */}
      <aside className="w-64 bg-surface border-r border-border/50 hidden md:block p-4 space-y-6 flex-shrink-0">
        <div className="flex items-center gap-2 px-2 py-4 border-b border-border/30">
          <span className="text-2xl">🌶️</span>
          <span className="font-bold text-lg tracking-wide text-white">Seblak Asik</span>
        </div>
        <nav className="space-y-1">
          {sidebarLinks.map((link, idx) => (
            <Link
              key={idx}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-md font-medium text-sm transition-all ${
                link.active 
                  ? 'bg-primary text-white shadow-md font-semibold' 
                  : 'text-textmuted hover:bg-surface2 hover:text-text'
              }`}
            >
              <span className="text-base">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* KANAN: UTAMA DASHBOARD CONTENT */}
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        
        {/* HEADER & FILTER */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">🏠 Ringkasan Eksekutif</h1>
            <p className="text-sm text-textmuted">Pusat kendali performa bisnis Seblak Asik</p>
          </div>
          <div className="flex bg-surface2 p-1 rounded-lg gap-1 border border-border/50">
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
          </div>
        </div>

        {/* 4 METRIK CARD */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ProgressBar label="💰 REVENUE" actualText={formatRupiah(actualRevenue)} pct={pctRevenue} targetText={formatRupiah(targetRevenue)} />
          <ProgressBar label="📊 GPM (Gross Margin)" actualText={`${actualGPM.toFixed(1)}%`} pct={pctGPM} targetText={`${targetGPM}%`} />
          <ProgressBar label="☕ EBITDA" actualText={formatRupiah(actualEBITDA)} pct={pctEBITDA} targetText={formatRupiah(targetMonthlyEBITDA)} />
          <ProgressBar label="💵 NPM (Net Margin)" actualText={`${actualNPM.toFixed(1)}%`} pct={pctNPM} targetText={`${targetNPM}%`} />
        </div>

        {/* GRAFIK */}
        <Card title="📈 Pergerakan Omzet Kotor (Revenue)">
          {chartData.length > 0 ? (
            <div className="h-64"><SalesLineChart data={chartData} /></div>
          ) : (
            <div className="h-64 flex items-center justify-center text-textmuted">Belum ada data transaksi yang diinput di spreadsheet.</div>
          )}
        </Card>

        {/* TABEL PRODUK */}
        <Card title="📋 Laporan Performa Produk Terjual (Kuantitas)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface2 p-4 rounded-lg border border-border/50">
              <h3 className="font-bold text-success mb-3 flex items-center gap-2">🔥 Produk Teratas (Best Seller)</h3>
              <ul className="space-y-2">
                {topProducts.map((p, i) => (
                  <li key={i} className="flex justify-between items-center text-sm border-b border-border/30 pb-1">
                    <span className="text-text">{i + 1}. {p.name}</span>
                    <span className="font-semibold">{p.qty} Porsi</span>
                  </li>
                ))}
                {topProducts.length === 0 && <p className="text-xs text-textmuted">Belum ada data penjualan produk.</p>}
              </ul>
            </div>

            <div className="bg-surface2 p-4 rounded-lg border border-border/50">
              <h3 className="font-bold text-info mb-3 flex items-center gap-2">🧊 Produk Terendah (Worst Seller)</h3>
              <ul className="space-y-2">
                {worstProducts.map((p, i) => (
                  <li key={i} className="flex justify-between items-center text-sm border-b border-border/30 pb-1">
                    <span className="text-text">{i + 1}. {p.name}</span>
                    <span className="font-semibold">{p.stock_out_total || 0} Porsi</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        {/* STOK KRITIS */}
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

      </main>
    </div>
  );
}

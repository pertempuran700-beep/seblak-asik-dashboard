'use client';
import { useState, useMemo } from 'react';
import { useData } from '@/hooks/useData';
import { api } from '@/lib/api';
import Card from '@/components/ui/Card';
import { formatRupiah, formatTanggalPendek } from '@/lib/utils';
import SalesLineChart from '@/components/charts/SalesLineChart'; 

export default function OverviewDashboard() {
  // State untuk Filter Periode
  const [period, setPeriod] = useState('30'); 
  const [showCalendar, setShowCalendar] = useState(false);
  const [customRange, setCustomDates] = useState({ start: '', end: '' });
  const [activeCustomRange, setActiveCustomRange] = useState({ start: null, end: null });

  // Menarik Data dari API
  const { data: settings } = useData(() => api.getSystemSettings(), []);
  const { data: sales } = useData(() => api.getSales({}), []);
  const { data: products } = useData(() => api.listProducts(), []);
  
  // Mengambil data metrik bulan ini
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const { data: metrics } = useData(() => api.getFinancialMetrics(`${currentYear}-${String(currentMonth).padStart(2, '0')}`), []);

  // 1. FILTER TRANSAKSI BERDASARKAN RENTANG TANGGAL (Core Engine)
  const filteredSales = useMemo(() => {
    if (!sales) return [];
    const now = new Date();
    
    return sales.filter(s => {
      const saleDate = new Date(s.date);
      
      // Rentang Kustom
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
      return true; // 'all'
    });
  }, [sales, period, activeCustomRange]);

  // 2. PEMISAHAN REVENUE MURNI VS INFORMASI QRIS KOTAK ATAS
  
  // REVENUE MURNI (Hanya transaksi non-QRIS / Kasir Tunai)
  const actualRevenue = useMemo(() => {
    return filteredSales
      .filter(s => !s.is_qris) // Filter HANYA transaksi tunai
      .reduce((sum, s) => sum + Number(s.yang_diterima || 0), 0);
  }, [filteredSales]);

  // INFORMASI QRIS (Berdiri Sendiri, untuk Papan Monitor Atas)
  const qrisMetrics = useMemo(() => {
    const adminFeePct = Number(settings?.admin_fee_percent || 2);
    const qrisTransactions = filteredSales.filter(s => s.is_qris === true);

    const gross = qrisTransactions.reduce((sum, s) => sum + Number(s.total || s.yang_diterima || 0), 0);
    const mdr = qrisTransactions.reduce((sum, s) => sum + Number(s.mdr || 0), 0) || Math.round((gross * adminFeePct) / 100);
    const net = gross - mdr;

    return { gross, mdr, net };
  }, [filteredSales, settings]);

  // 3. LAPORAN PRODUK: BEST SELLER & WORST SELLER SANGAT DINAMIS
  const { dynamicTopProducts, dynamicWorstProducts } = useMemo(() => {
    if (!products) return { dynamicTopProducts: [], dynamicWorstProducts: [] };

    // a. Buat "Papan Skor" kosong untuk semua produk aktif
    const productScoreboard = {};
    products.filter(p => p.status !== 'Discontinued').forEach(p => {
      productScoreboard[p.name] = 0; // Set semua produk defaultnya 0
    });

    // b. Isi "Papan Skor" dengan kuantitas yang terjual pada rentang tanggal aktif
    filteredSales.forEach(s => {
      if (s.items && Array.isArray(s.items)) {
        s.items.forEach(item => {
          if (productScoreboard[item.name] !== undefined) {
             productScoreboard[item.name] += Number(item.quantity || item.qty || 0);
          }
        });
      }
    });

    // c. Ubah bentuknya jadi Array agar bisa di-sort
    const sortedProducts = Object.entries(productScoreboard)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty); // Urutkan dari Terbanyak ke Terdikit

    // d. Pisahkan Top 10 dan Bottom 5
    const top10 = sortedProducts.slice(0, 10);
    const bottom5 = [...sortedProducts].reverse().slice(0, 5); // Balik urutannya ambil 5 paling buncit

    return { dynamicTopProducts: top10, dynamicWorstProducts: bottom5 };
  }, [filteredSales, products]);

  // 4. KALKULASI METRIK LAINNYA & TARGET PROPORSIONAL
  const actualGPM = metrics?.current?.gross_margin_pct || 0; 
  const actualEBITDA = metrics?.current?.ebitda || 0;
  const actualNPM = metrics?.current?.revenue > 0 ? (metrics.current.net_profit / metrics.current.revenue) * 100 : 0;

  // Nilai Target dari Settings
  const targetMonthlyRevenue = Number(settings?.target_revenue_monthly || 50000000);
  const targetGPM = Number(settings?.target_gpm_percent || 65);
  const targetMonthlyEBITDA = Number(settings?.target_ebitda_monthly || 15000000);
  const targetNPM = Number(settings?.target_npm_percent || 20);

  // Divider Hari untuk menargetkan progres sesuai rentang tanggal
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
    return 365; // 'all'
  }, [period, activeCustomRange]);

  const targetRevenue = (targetMonthlyRevenue / 30) * timeDivider;
  const targetEBITDA = (targetMonthlyEBITDA / 30) * timeDivider;

  // Persentase Pencapaian Target
  const pctRevenue = Math.min((actualRevenue / targetRevenue) * 100, 100) || 0;
  const pctGPM = Math.min((actualGPM / targetGPM) * 100, 100) || 0;
  const pctEBITDA = Math.min((actualEBITDA / targetMonthlyEBITDA) * 100, 100) || 0;
  const pctNPM = Math.min((actualNPM / targetNPM) * 100, 100) || 0;

  const getProgressColor = (pct) => {
    if (pct >= 85) return 'bg-success'; 
    if (pct >= 50) return 'bg-warning'; 
    return 'bg-danger'; 
  };

  // 5. DATA GRAFIK REVENUE (Gabungan Total Omzet)
  const chartData = useMemo(() => {
    const grouped = {};
    filteredSales.forEach(s => {
      const dateStr = formatTanggalPendek(s.date);
      grouped[dateStr] = (grouped[dateStr] || 0) + Number(s.yang_diterima || 0);
    });
    return Object.keys(grouped).map(date => ({ label: date, revenue: grouped[date] })).reverse();
  }, [filteredSales]);
    
  const criticalStock = (products || []).filter(p => p.current_stock <= p.min_stock);

  // Aksi Klik Kustom Tanggal
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      
      {/* HEADER & FILTER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">🏠 Ringkasan Eksekutif</h1>
          <p className="text-sm text-textmuted">Pusat kendali performa bisnis Seblak Asik</p>
        </div>
        
        {/* WADAH FILTER - Diubah strukturnya agar label kustom tidak tumpang tindih */}
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

            {/* SINGLE ICON KALENDER CUSTOM */}
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
          
          {/* INDIKATOR LABEL TANGGAL AKTIF KUSTOM */}
          {period === 'custom' && activeCustomRange.start && (
            <div className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Menampilkan data: {formatTanggalPendek(activeCustomRange.start)} - {formatTanggalPendek(activeCustomRange.end)}
            </div>
          )}
        </div>
      </div>

      {/* MONITOR QRIS (Pisah dari Revenue Kasir) */}
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

      {/* 4 METRIK UTAMA DENGAN PROGRESS BAR */}
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

      {/* GRAFIK TOTAL OMZET GABUNGAN */}
      <Card title="📈 Pergerakan Total Penjualan Harian">
        {chartData.length > 0 ? (
          <div className="h-64">
            <SalesLineChart data={chartData} />
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-textmuted">Belum ada data untuk periode ini</div>
        )}
      </Card>

      {/* LAPORAN PRODUK TERJUAL (100% DINAMIS) */}
      <Card title="📋 Laporan Performa Kuantitas Produk Terjual">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sisi Kiri: Best Seller */}
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

          {/* Sisi Kanan: Worst Seller */}
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

      {/* PEMANTAU STOK KRITIS */}
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

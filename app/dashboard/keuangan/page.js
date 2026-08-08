'use client';
import { useState, useMemo } from 'react';
import { useData } from '@/hooks/useData';
import { api } from '@/lib/api';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Tabs from '@/components/ui/Tabs';
import { Select } from '@/components/ui/Input';
import { formatRupiah, currentMonthYear, formatTanggalPendek } from '@/lib/utils';
// Gunakan komponen grafik yang bisa multi-line
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

// Komponen Multi-Line Chart Khusus Keuangan
function FinanceTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="label" stroke="#A0A0C0" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#A0A0C0" fontSize={12} tickFormatter={(val) => `Rp ${val / 1000000}Jt`} tickLine={false} axisLine={false} />
        <Tooltip formatter={(v) => formatRupiah(v)} contentStyle={{ background: '#1A1A3E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }} />
        <Legend wrapperStyle={{ fontSize: 12, color: '#A0A0C0' }} />
        <Line type="monotone" dataKey="revenue" stroke="#A0A0C0" strokeWidth={2} name="Revenue" dot={{ r: 2 }} />
        <Line type="monotone" dataKey="grossProfit" stroke="#3498db" strokeWidth={2.5} name="Gross Profit" dot={{ r: 2 }} />
        <Line type="monotone" dataKey="opex" stroke="#e74c3c" strokeWidth={2} name="Total OPEX" dot={{ r: 2 }} />
        <Line type="monotone" dataKey="netProfit" stroke="#00B894" strokeWidth={3} name="Net Profit (NPM)" dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function monthOptions() {
  const opts = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({ value: `${d.getFullYear()}-${d.getMonth() + 1}`, label: d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) });
  }
  return opts;
}

function yearOptions() {
  const opts = [];
  const startYear = 2024;
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= startYear; y--) {
    opts.push({ value: String(y), label: `Tahun ${y}` });
  }
  return opts;
}

export default function KeuanganPage() {
  const { month: curMonth, year: curYear } = currentMonthYear();
  const [tabView, setTabView] = useState('bulanan');
  
  // State Filter
  const [monthPeriod, setMonthPeriod] = useState(`${curYear}-${curMonth}`);
  const [yearPeriod, setYearPeriod] = useState(String(curYear));

  // Destructure parameter
  const targetYear = tabView === 'bulanan' ? Number(monthPeriod.split('-')[0]) : Number(yearPeriod);
  const targetMonth = tabView === 'bulanan' ? Number(monthPeriod.split('-')[1]) : null; // null memicu rekap tahunan di backend

  // Tarik Data (Disesuaikan berdasarkan bulan atau null untuk tahun)
  const { data: statement, loading, refetch } = useData(() => api.generateIncomeStatement(targetMonth, targetYear), [targetMonth, targetYear, tabView]);
  
  // Tarik Data Pengeluaran & Hutang
  const { data: apar } = useData(() => api.getAPAR(), []);
  const { data: expensesRaw } = useData(() => api.listExpenses({ month: targetMonth, year: targetYear }), [targetMonth, targetYear, tabView]);

  // Siapkan Data Grafik
  // Jika bulanan, ambil data rawSales untuk membuat chart per tanggal
  const { data: rawSales } = useData(() => {
    if (tabView !== 'bulanan') return Promise.resolve([]);
    const startStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    const endStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${lastDay}`;
    return api.getSales({ startDate: startStr, endDate: endStr });
  }, [targetMonth, targetYear, tabView]);

  const chartData = useMemo(() => {
    if (tabView === 'tahunan' && statement?.monthly_breakdown) {
      return statement.monthly_breakdown.map(m => ({
        label: m.month_name, revenue: m.revenue, grossProfit: m.grossProfit, opex: m.opex, netProfit: m.netProfit
      }));
    } else {
      // Bulanan (hanya bisa menampilkan revenue karena HPP/OPEX per hari terlalu kompleks direkap di client)
      // Namun agar rapi, kita tetap gunakan komponen yang sama
      const grouped = {};
      (rawSales || []).forEach(s => {
        const dateStr = formatTanggalPendek(s.date);
        grouped[dateStr] = (grouped[dateStr] || 0) + Number(s.yang_diterima || s.total || 0);
      });
      return Object.keys(grouped).map(date => ({ 
        label: date, revenue: grouped[date], grossProfit: 0, opex: 0, netProfit: 0 
      })).reverse();
    }
  }, [tabView, statement, rawSales]);

  // Komponen Card
  const MetricCard = ({ label, value, color }) => (
    <div className={`bg-surface2 p-4 rounded-card border-l-4 border-${color} shadow-sm`}>
      <p className="text-xs text-textmuted uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-bold text-${color}`}>{formatRupiah(value)}</p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">💰 Papan Utama Keuangan</h1>
          <p className="text-sm text-textmuted">Kalkulasi Laporan Laba Rugi Komprehensif (Income Statement)</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Tabs tabs={[{ value: 'bulanan', label: 'Per-Bulan' }, { value: 'tahunan', label: 'Per-Tahun' }]} active={tabView} onChange={setTabView} />
          
          <div className="w-40">
            {tabView === 'bulanan' ? (
              <Select options={monthOptions()} value={monthPeriod} onChange={(e) => setMonthPeriod(e.target.value)} />
            ) : (
              <Select options={yearOptions()} value={yearPeriod} onChange={(e) => setYearPeriod(e.target.value)} />
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-center py-10 text-textmuted">Memuat buku besar keuangan...</p>
      ) : statement ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Revenue" value={statement.revenue} color="white" />
            <MetricCard label={`Gross Profit (${statement.gross_margin_pct.toFixed(1)}%)`} value={statement.gross_profit} color="info" />
            <MetricCard label="Total OPEX" value={statement.opex} color="danger" />
            <MetricCard label="Net Profit (NPM)" value={statement.net_profit} color="success" />
          </div>

          <Card title={`📈 Tren Keuangan ${tabView === 'tahunan' ? '12 Bulan Terakhir' : 'Harian'}`}>
            <FinanceTrendChart data={chartData} />
            {tabView === 'bulanan' && <p className="text-[10px] text-textmuted mt-2 italic">*Untuk tampilan per-hari, grafik hanya menampilkan garis Revenue (Pendapatan Kasir).</p>}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title={`Buku Besar Income Statement — ${statement.period}`}>
              <div className="space-y-3 font-medium text-sm">
                <div className="flex justify-between"><span className="text-textmuted">Pendapatan Kotor (Revenue)</span><span>{formatRupiah(statement.revenue)}</span></div>
                <div className="flex justify-between text-danger"><span className="text-textmuted">(-) HPP Bahan Baku (COGS)</span><span>-{formatRupiah(statement.cogs)}</span></div>
                <div className="flex justify-between border-t border-white/[0.1] pt-2 font-bold text-info"><span>Laba Kotor (Gross Profit)</span><span>{formatRupiah(statement.gross_profit)}</span></div>
                
                <div className="flex justify-between text-danger mt-4"><span className="text-textmuted">(-) OPEX Variabel (Pengeluaran Kas)</span><span>-{formatRupiah(statement.opex_var)}</span></div>
                <div className="flex justify-between text-danger"><span className="text-textmuted">(-) OPEX Tetap (Gaji, Sewa, dll)</span><span>-{formatRupiah(statement.opex_fixed)}</span></div>
                <div className="flex justify-between border-t border-white/[0.1] pt-2 font-bold text-warning"><span>EBITDA (Laba Operasional)</span><span>{formatRupiah(statement.ebitda)}</span></div>
                
                <div className="flex justify-between text-danger mt-4"><span className="text-textmuted">(-) Pajak & Depresiasi</span><span>-{formatRupiah(statement.depreciation)}</span></div>
                <div className="flex justify-between border-t border-white/[0.2] pt-2 font-black text-success text-lg"><span>Laba Bersih (Net Profit / NPM)</span><span>{formatRupiah(statement.net_profit)}</span></div>
              </div>
            </Card>

            <div className="space-y-6">
              <Card title="💸 Ringkasan Pengeluaran Kas (Variabel)">
                {tabView === 'bulanan' ? (
                  <Table
                    columns={[
                      { key: 'date', label: 'Tanggal', render: (r) => formatTanggalPendek(r.date) },
                      { key: 'category', label: 'Kategori' },
                      { key: 'amount', label: 'Nominal', render: (r) => <span className="font-bold text-danger">{formatRupiah(r.amount)}</span> },
                    ]}
                    rows={(expensesRaw || []).slice(0, 7)}
                    emptyMessage="Tidak ada pengeluaran kas di bulan ini"
                  />
                ) : (
                  <Table
                    columns={[
                      { key: 'period', label: 'Bulan' },
                      { key: 'total', label: 'Total Pengeluaran', render: (r) => <span className="font-bold text-danger">{formatRupiah(r.total)}</span> },
                    ]}
                    rows={statement.expense_breakdown}
                    emptyMessage="Tidak ada pengeluaran kas di tahun ini"
                  />
                )}
              </Card>

              <Card title="📋 Status Hutang Terbuka (Vendor)">
                <Table
                  columns={[
                    { key: 'counterparty', label: 'Nama Vendor' },
                    { key: 'remaining', label: 'Sisa Hutang', render: (r) => <span className="font-bold text-danger">{formatRupiah(r.remaining)}</span> },
                  ]}
                  rows={(apar || []).filter(r => r.type === 'Payable' && r.status !== 'Paid').slice(0, 5)}
                  emptyMessage="Semua hutang lunas!"
                />
              </Card>
            </div>
          </div>
        </>
      ) : (
        <p className="text-center py-10 text-textmuted">Data gagal dimuat.</p>
      )}
    </div>
  );
}

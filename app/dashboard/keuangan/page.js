'use client';
import { useState, useMemo } from 'react';
import { useData } from '@/hooks/useData';
import { api } from '@/lib/api';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Tabs from '@/components/ui/Tabs';
import { Select } from '@/components/ui/Input';
import { formatRupiah, currentMonthYear, formatTanggalPendek } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import MarketingCostForm from '@/components/forms/MarketingCostForm';

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

function CategoryBreakdownCard({ title, rows }) {
  const [expandedCat, setExpandedCat] = useState(null);

  return (
    <Card title={title}>
      {(!rows || rows.length === 0) ? (
        <p className="text-textmuted text-sm text-center py-6">Tidak ada data bulan ini</p>
      ) : (
        <div className="space-y-1">
          {rows.map((r, i) => (
            <div key={i} className="border-b border-white/[0.05] last:border-0">
              <button
                type="button"
                onClick={() => setExpandedCat(expandedCat === r.category ? null : r.category)}
                className="w-full flex justify-between items-center py-2.5 text-sm hover:bg-white/[0.02] transition-colors"
              >
                <span className="flex items-center gap-1.5 font-medium">
                  <span className={`text-xs transition-transform ${expandedCat === r.category ? 'rotate-90' : ''}`}>▶</span>
                  {r.category}
                </span>
                <span className="font-bold">{formatRupiah(r.amount)}</span>
              </button>
              {expandedCat === r.category && r.items && r.items.length > 0 && (
                <div className="pl-6 pb-2 space-y-1">
                  {r.items.map((it, j) => (
                    <div key={j} className="flex justify-between text-xs text-textmuted py-1">
                      <span>{it.name}</span>
                      <span>{formatRupiah(it.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function CashOutflowDashboard({ monthPeriod }) {
  const [year, month] = monthPeriod.split('-').map(Number);
  const { data: report, loading } = useData(() => api.getCashOutflowDashboard(month, year), [month, year]);

  const BarRow = ({ item }) => (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1 text-sm">
        <span className="font-medium">{item.category}</span>
        <span className="text-textmuted text-xs">{item.source}</span>
        <span className="font-bold">{formatRupiah(item.amount)}</span>
      </div>
      <div className="w-full bg-surface2 rounded-full h-2 overflow-hidden">
        <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(item.pct, 100)}%` }} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {loading ? (
        <p className="text-center py-10 text-textmuted">Memuat dashboard uang keluar...</p>
      ) : report ? (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface2 p-4 rounded-card border-l-4 border-danger">
              <p className="text-xs text-textmuted uppercase mb-1">Total Uang Keluar</p>
              <p className="text-xl font-bold text-danger">{formatRupiah(report.total_outflow)}</p>
            </div>
            <div className="bg-surface2 p-4 rounded-card border-l-4 border-info">
              <p className="text-xs text-textmuted uppercase mb-1">COGS (Stock In + Bumbu)</p>
              <p className="text-xl font-bold text-info">{formatRupiah(report.cogs)}</p>
            </div>
            <div className="bg-surface2 p-4 rounded-card border-l-4 border-warning">
              <p className="text-xs text-textmuted uppercase mb-1">OPEX Variabel (Biaya Lainnya)</p>
              <p className="text-xl font-bold text-warning">{formatRupiah(report.opex_var)}</p>
            </div>
          </div>

          <Card title="🔍 Kemana Uang Paling Banyak Keluar?">
            {report.combined_breakdown.length === 0 ? (
              <p className="text-textmuted text-sm text-center py-6">Belum ada pengeluaran di bulan ini</p>
            ) : (
              report.combined_breakdown.map((item, i) => <BarRow key={i} item={item} />)
            )}
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <CategoryBreakdownCard title="📦 Pengeluaran Produk per Kategori (Stock In + Bumbu)" rows={report.stock_in_breakdown} />
            <CategoryBreakdownCard title="🧾 Pengeluaran Operasional per Kategori" rows={report.expense_breakdown} />
          </div>

          <Card title="⚖️ Head-to-Head: COGS Laporan Produk vs COGS Stock In">
            <p className="text-xs text-textmuted mb-3">
              Membandingkan biaya bahan baku yang seharusnya (dari HPP penjualan) dengan realisasi uang yang dikeluarkan (Stock In + Bumbu), per kategori.
            </p>
            <Table
              columns={[
                { key: 'category', label: 'Kategori' },
                { key: 'cogs_sales', label: 'COGS Laporan Produk', render: (r) => formatRupiah(r.cogs_sales) },
                { key: 'cogs_stockin', label: 'COGS Stock In', render: (r) => formatRupiah(r.cogs_stockin) },
                {
                  key: 'diff', label: 'Selisih',
                  render: (r) => (
                    <span className={`font-bold ${r.over ? 'text-danger' : 'text-success'}`}>
                      {r.over ? '+' : ''}{formatRupiah(r.diff)}
                    </span>
                  ),
                },
              ]}
              rows={report.head_to_head}
              emptyMessage="Tidak ada data di bulan ini"
            />
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/[0.08] text-sm font-bold">
              <span>Total</span>
              <div className="flex gap-8">
                <span className="text-info">{formatRupiah(report.cogs_from_sales_total)}</span>
                <span className="text-warning">{formatRupiah(report.cogs)}</span>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <p className="text-center py-10 text-textmuted">Data gagal dimuat.</p>
      )}
    </div>
  );
}

function OtherCostsDashboard({ monthPeriod }) {
  const [year, month] = monthPeriod.split('-').map(Number);
  const { data: otherCostReport, loading } = useData(() => api.getOtherCostsReport(month, year), [month, year]);

  return (
    <div className="space-y-6">
      {loading ? (
        <p className="text-center py-10 text-textmuted">Memuat data biaya lainnya...</p>
      ) : (
        <>
          <div className="bg-surface2 p-4 rounded-card border-l-4 border-warning">
            <p className="text-xs text-textmuted uppercase mb-1">Total Biaya Lainnya Bulan Ini</p>
            <p className="text-2xl font-bold text-warning">{formatRupiah(otherCostReport?.total || 0)}</p>
            <p className="text-[10px] text-textmuted mt-1 italic">*Hanya kategori "Lain-lain". Kategori "Bumbu" masuk ke COGS, lihat di tab Uang Keluar.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card title="📂 Breakdown per Item">
              <Table
                columns={[
                  { key: 'item', label: 'Item' },
                  { key: 'total', label: 'Total', render: (r) => formatRupiah(r.total) },
                ]}
                rows={otherCostReport?.breakdown || []}
                emptyMessage="Belum ada biaya lainnya bulan ini"
              />
            </Card>
            <Card title="📋 Riwayat Pencatatan">
              <Table
                columns={[
                  { key: 'date', label: 'Tanggal', render: (r) => new Date(r.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) },
                  { key: 'description', label: 'Item' },
                  { key: 'amount', label: 'Nominal', render: (r) => formatRupiah(r.amount) },
                  { key: 'recorded_by', label: 'Dicatat Oleh' },
                ]}
                rows={otherCostReport?.records || []}
                emptyMessage="Belum ada catatan"
              />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default function KeuanganPage() {
  function MarketingDashboard({ monthPeriod }) {
  const [year, month] = monthPeriod.split('-').map(Number);
  const [modal, setModal] = useState(false);
  const { data: report, loading, refetch } = useData(() => api.getMarketingDashboard(month, year), [month, year]);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setModal(true)}>+ Input Biaya Marketing</Button>
      </div>

      {loading ? (
        <p className="text-center py-10 text-textmuted">Memuat data marketing...</p>
      ) : report ? (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface2 p-4 rounded-card border-l-4 border-warning">
              <p className="text-xs text-textmuted uppercase mb-1">Biaya Marketing</p>
              <p className="text-xl font-bold text-warning">{formatRupiah(report.spend)}</p>
            </div>
            <div className="bg-surface2 p-4 rounded-card border-l-4 border-info">
              <p className="text-xs text-textmuted uppercase mb-1">Revenue Bulan Ini</p>
              <p className="text-xl font-bold text-info">{formatRupiah(report.revenue)}</p>
            </div>
            <div className="bg-surface2 p-4 rounded-card border-l-4 border-success">
              <p className="text-xs text-textmuted uppercase mb-1">ROI (Revenue / Marketing)</p>
              <p className="text-xl font-bold text-success">{report.roi.toFixed(1)}x</p>
            </div>
          </div>

          <Card title="📈 Tren 12 Bulan Terakhir">
            <FinanceTrendChart data={report.history.map(h => ({ label: h.label, revenue: h.revenue, grossProfit: h.spend, opex: 0, netProfit: 0 }))} />
            <p className="text-[10px] text-textmuted mt-2">*Garis abu = Revenue, garis biru = Biaya Marketing (garis lain diabaikan di grafik ini)</p>
          </Card>

          <Card title="📋 Histori Biaya Marketing">
            <Table
              columns={[
                { key: 'label', label: 'Bulan' },
                { key: 'spend', label: 'Biaya Marketing', render: (r) => formatRupiah(r.spend) },
                { key: 'revenue', label: 'Revenue', render: (r) => formatRupiah(r.revenue) },
                { key: 'roi', label: 'ROI', render: (r) => r.spend > 0 ? r.roi.toFixed(1) + 'x' : '-' },
              ]}
              rows={report.history}
              emptyMessage="Belum ada data"
            />
          </Card>
        </>
      ) : (
        <p className="text-center py-10 text-textmuted">Data gagal dimuat.</p>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="📢 Input Biaya Marketing">
        <MarketingCostForm onSuccess={refetch} onClose={() => setModal(false)} />
      </Modal>
    </div>
  );
}
  const { user } = useAuth();
  if (user && user.role !== 'owner') {
    return <div className="text-center mt-20 text-textmuted">Akses Ditolak. Halaman ini khusus Owner.</div>;
  }

  const { month: curMonth, year: curYear } = currentMonthYear();
  const [topTab, setTopTab] = useState('ringkasan');
  const [tabView, setTabView] = useState('bulanan');

  const [monthPeriod, setMonthPeriod] = useState(`${curYear}-${String(curMonth).padStart(2, '0')}`);
  const [yearPeriod, setYearPeriod] = useState(String(curYear));

  const targetYear = tabView === 'bulanan' ? Number(monthPeriod.split('-')[0]) : Number(yearPeriod);
  const targetMonth = tabView === 'bulanan' ? Number(monthPeriod.split('-')[1]) : null;

  const { data: statement, loading } = useData(() => api.generateIncomeStatement(targetMonth, targetYear), [targetMonth, targetYear, tabView]);
  const { data: apar } = useData(() => api.getAPAR(), []);
  const { data: expensesRaw } = useData(() => api.listExpenses({ month: targetMonth, year: targetYear }), [targetMonth, targetYear, tabView]);

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
    } else if (tabView === 'bulanan' && rawSales && statement) {
      const grouped = {};
      rawSales.filter(s => !s.is_qris).forEach(s => {
        const dateStr = formatTanggalPendek(s.date);
        grouped[dateStr] = (grouped[dateStr] || 0) + Number(s.yang_diterima || s.total || 0);
      });

      const revTotal = statement.revenue || 1;
      const cogsRatio = statement.cogs / revTotal;
      const opexVarRatio = statement.opex_var / revTotal;

      const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
      const dailyFixedOpex = statement.opex_fixed / daysInMonth;
      const dailyTaxDep = statement.depreciation / daysInMonth;

      return Object.keys(grouped).map(date => {
        const dailyRev = grouped[date];
        const dailyCogs = dailyRev * cogsRatio;
        const dailyGross = dailyRev - dailyCogs;
        const dailyOpex = (dailyRev * opexVarRatio) + dailyFixedOpex;
        const dailyNet = dailyGross - dailyOpex - dailyTaxDep;

        return { label: date, revenue: dailyRev, grossProfit: dailyGross, opex: dailyOpex, netProfit: dailyNet };
      }).reverse();
    }
    return [];
  }, [tabView, statement, rawSales, targetMonth, targetYear]);

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
        <Tabs
          tabs={[
            { value: 'ringkasan', label: 'Ringkasan' },
            { value: 'lainnya', label: 'Biaya Lainnya' },
            { value: 'uangkeluar', label: 'Uang Keluar' },
          ]}
          active={topTab}
          onChange={setTopTab}
        />
      </div>

      {topTab === 'ringkasan' && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
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
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title={`Buku Besar Income Statement — ${statement.period}`}>
                  <div className="space-y-3 font-medium text-sm">
                    <div className="flex justify-between"><span className="text-textmuted">Pendapatan Kotor (Revenue)</span><span>{formatRupiah(statement.revenue)}</span></div>
                    <div className="flex justify-between text-danger"><span className="text-textmuted">(-) COGS (Stock In + Bumbu)</span><span>-{formatRupiah(statement.cogs)}</span></div>
                    <div className="flex justify-between border-t border-white/[0.1] pt-2 font-bold text-info"><span>Laba Kotor (Gross Profit)</span><span>{formatRupiah(statement.gross_profit)}</span></div>

                    <div className="flex justify-between text-danger mt-4"><span className="text-textmuted">(-) OPEX Variabel (Pengeluaran Kas)</span><span>-{formatRupiah(statement.opex_var)}</span></div>
                    <div className="flex justify-between text-danger"><span className="text-textmuted">(-) OPEX Tetap (Gaji, Sewa, dll)</span><span>-{formatRupiah(statement.opex_fixed)}</span></div>
                    <div className="flex justify-between border-t border-white/[0.1] pt-2 font-bold text-warning"><span>EBITDA (Laba Operasional)</span><span>{formatRupiah(statement.ebitda)}</span></div>

                    <div className="flex justify-between text-danger mt-4"><span className="text-textmuted">(-) Pajak & Depresiasi</span><span>-{formatRupiah(statement.depreciation)}</span></div>
                    <div className="flex justify-between border-t border-white/[0.2] pt-2 font-black text-success text-lg"><span>Laba Bersih (Net Profit / NPM)</span><span>{formatRupiah(statement.net_profit)}</span></div>
                  </div>
                  <p className="text-[10px] text-textmuted mt-3 italic">*COGS versi HPP dari penjualan (metrik pembanding): {formatRupiah(statement.cogs_from_sales)} — lihat detail di tab Penjualan &gt; Dashboard Produk</p>
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
                        rows={(expensesRaw || []).filter(e => e.category !== 'Bumbu').slice(0, 7)}
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
        </>
      )}

      {topTab === 'lainnya' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <div className="w-40">
              <Select options={monthOptions()} value={monthPeriod} onChange={(e) => setMonthPeriod(e.target.value)} />
            </div>
          </div>
          <OtherCostsDashboard monthPeriod={monthPeriod} />
        </div>
      )}

      {topTab === 'uangkeluar' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <div className="w-40">
              <Select options={monthOptions()} value={monthPeriod} onChange={(e) => setMonthPeriod(e.target.value)} />
            </div>
          </div>
          <CashOutflowDashboard monthPeriod={monthPeriod} />
        </div>
      )}
    </div>
  );
}

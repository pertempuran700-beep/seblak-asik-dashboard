'use client';
import { useState } from 'react';
import { useData } from '@/hooks/useData';
import { api } from '@/lib/api';
import Card, { MetricCard } from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ExpenseForm from '@/components/forms/ExpenseForm';
import ProfitTrendChart from '@/components/charts/ProfitTrendChart';
import { Select } from '@/components/ui/Input';
import { formatRupiah, currentMonthYear } from '@/lib/utils';

function monthOptions() {
  const opts = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({ value: `${d.getFullYear()}-${d.getMonth() + 1}`, label: d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) });
  }
  return opts;
}

export default function KeuanganPage() {
  const { month: curMonth, year: curYear } = currentMonthYear();
  const [period, setPeriod] = useState(`${curYear}-${curMonth}`);
  const [year, month] = period.split('-').map(Number);

  const { data: statement, loading, refetch } = useData(() => api.generateIncomeStatement(month, year), [month, year]);
  const { data: apar } = useData(() => api.getAPAR(), []);
  const { data: expenses, refetch: refetchExpenses } = useData(() => api.listExpenses({ month, year }), [month, year]);
  const [expenseModal, setExpenseModal] = useState(false);

  function refetchAll() {
    refetch();
    refetchExpenses();
  }

  const trendData = statement
    ? [{ label: statement.period, grossProfit: statement.gross_profit, netProfit: statement.net_profit }]
    : [];

  const rows = statement
    ? [
        { label: 'Revenue', value: statement.revenue },
        { label: '− COGS', value: -statement.cogs },
        { label: '= Gross Profit', value: statement.gross_profit, bold: true },
        { label: '− OPEX', value: -statement.opex },
        { label: '= EBITDA', value: statement.ebitda, bold: true },
        { label: '− Depresiasi', value: -statement.depreciation },
        { label: '= EBIT', value: statement.ebit, bold: true },
        { label: '− Pajak & Bunga', value: -statement.tax_interest },
        { label: '= Net Profit', value: statement.net_profit, bold: true, accent: true },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold">💰 Laporan Keuangan</h1>
        <div className="flex items-center gap-3">
          <div className="w-48">
            <Select options={monthOptions()} value={period} onChange={(e) => setPeriod(e.target.value)} />
          </div>
          <Button onClick={() => setExpenseModal(true)}>+ Catat Pengeluaran</Button>
        </div>
      </div>

      {loading ? (
        <p className="text-textmuted text-sm">Menghitung laporan...</p>
      ) : statement ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Revenue" value={formatRupiah(statement.revenue)} />
            <MetricCard label="Gross Profit" value={formatRupiah(statement.gross_profit)} change={`Margin ${statement.gross_margin_pct.toFixed(1)}%`} />
            <MetricCard label="OPEX" value={formatRupiah(statement.opex)} />
            <MetricCard label="Net Profit" value={formatRupiah(statement.net_profit)} changeType="up" />
          </div>

          <Card title="Trend Profit">
            <ProfitTrendChart data={trendData} />
          </Card>

          <Card title={`Income Statement — ${statement.period}`}>
            <div className="space-y-2">
              {rows.map((r) => (
                <div
                  key={r.label}
                  className={`flex justify-between text-sm py-1.5 ${r.bold ? 'font-bold border-t border-white/[0.08] pt-2' : ''} ${r.accent ? 'text-primary' : ''}`}
                >
                  <span>{r.label}</span>
                  <span>{formatRupiah(r.value)}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-textmuted mt-4">
              Total diskon diberikan bulan ini: {formatRupiah(statement.total_discount_given)}
            </p>
          </Card>

          <Card title="Distribusi ke Shareholder">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard label="Owner (35%)" value={formatRupiah(statement.owner_share)} />
              <MetricCard label="Adhit (41.91%)" value={formatRupiah(statement.adhit_share)} />
              <MetricCard label="Reno (13.09%)" value={formatRupiah(statement.reno_share)} />
              <MetricCard label="Infaq (10%)" value={formatRupiah(statement.infaq_share)} />
            </div>
          </Card>
        </>
      ) : (
        <p className="text-textmuted text-sm">Belum ada data untuk periode ini.</p>
      )}

      <Card title="💸 Pengeluaran Bulan Ini">
        <Table
          columns={[
            { key: 'date', label: 'Tanggal', render: (r) => new Date(r.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) },
            { key: 'category', label: 'Kategori' },
            { key: 'description', label: 'Deskripsi' },
            { key: 'amount', label: 'Nominal', render: (r) => formatRupiah(r.amount) },
            { key: 'payment_method', label: 'Metode' },
          ]}
          rows={expenses || []}
        />
      </Card>

      <Card title="📋 Hutang & Piutang Ringkas" action={<Button variant="ghost" onClick={refetch}>Refresh</Button>}>
        <Table
          columns={[
            { key: 'type', label: 'Tipe', render: (r) => <Badge variant={r.type === 'Payable' ? 'danger' : 'success'}>{r.type === 'Payable' ? 'Hutang' : 'Piutang'}</Badge> },
            { key: 'counterparty', label: 'Pihak' },
            { key: 'remaining', label: 'Sisa', render: (r) => formatRupiah(r.remaining) },
            { key: 'status', label: 'Status', render: (r) => <Badge variant={r.status === 'Paid' ? 'success' : 'warning'}>{r.status}</Badge> },
          ]}
          rows={(apar || []).filter((r) => r.status !== 'Paid').slice(0, 5)}
        />
      </Card>

      <Modal open={expenseModal} onClose={() => setExpenseModal(false)} title="Catat Pengeluaran">
        <ExpenseForm onSuccess={refetchAll} onClose={() => setExpenseModal(false)} />
      </Modal>
    </div>
  );
}

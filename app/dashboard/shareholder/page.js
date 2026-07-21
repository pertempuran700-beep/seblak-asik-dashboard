'use client';
import { useState } from 'react';
import { useData } from '@/hooks/useData';
import { api } from '@/lib/api';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import { Select } from '@/components/ui/Input';
import ProductDonutChart from '@/components/charts/ProductDonutChart';
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

export default function ShareholderPage() {
  const { month: curMonth, year: curYear } = currentMonthYear();
  const [period, setPeriod] = useState(`${curYear}-${curMonth}`);
  const [year, month] = period.split('-').map(Number);

  const { data: report, loading } = useData(() => api.generateShareholderReport(month, year), [month, year]);
  const { data: infaqHistory } = useData(() => api.getInfaqHistory(), []);

  const donutData = report?.distribution?.map((d) => ({ name: d.recipient, qty: Math.round(d.amount) })) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold">👔 Laporan Pemegang Saham</h1>
        <div className="w-48">
          <Select options={monthOptions()} value={period} onChange={(e) => setPeriod(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <p className="text-textmuted text-sm">Menghitung distribusi...</p>
      ) : report ? (
        <>
          <Card>
            <p className="text-sm text-textmuted">Net Profit {report.period}</p>
            <p className="text-3xl font-bold mb-4">{formatRupiah(report.net_profit)}</p>

            <div className="grid md:grid-cols-2 gap-6 items-center">
              <Table
                columns={[
                  { key: 'recipient', label: 'Penerima' },
                  { key: 'percentage', label: '%', render: (r) => r.percentage.toFixed(2) + '%' },
                  { key: 'amount', label: 'Jumlah', render: (r) => formatRupiah(r.amount) },
                ]}
                rows={report.distribution}
              />
              {donutData.length > 0 && <ProductDonutChart data={donutData} />}
            </div>
          </Card>

          <Card title="🕌 Riwayat Infaq/Sedekah">
            <Table
              columns={[
                { key: 'period', label: 'Periode' },
                { key: 'amount', label: 'Jumlah', render: (r) => formatRupiah(r.amount) },
              ]}
              rows={infaqHistory || []}
            />
          </Card>
        </>
      ) : (
        <p className="text-textmuted text-sm">Belum ada data untuk periode ini.</p>
      )}
    </div>
  );
}

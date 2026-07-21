'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { api } from '@/lib/api';
import Card, { MetricCard } from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import SalesForm from '@/components/forms/SalesForm';
import SalesLineChart from '@/components/charts/SalesLineChart';
import { formatRupiah, formatTanggalPendek } from '@/lib/utils';

export default function PenjualanPage() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const canSell = user?.role === 'owner' || user?.role === 'admin';

  const { data: productList } = useData(() => api.listProducts(), []);
  const { data: sales, refetch } = useData(() => api.getSales({}), []);
  const { data: daily } = useData(() => api.getDailySummary(), []);

  const chartData = (sales || [])
    .slice(0, 14)
    .reverse()
    .map((s) => ({ label: formatTanggalPendek(s.date), revenue: Number(s.total) }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Penjualan</h1>
          <p className="text-textmuted text-sm">Riwayat transaksi &amp; input penjualan prasmanan</p>
        </div>
        {canSell && <Button onClick={() => setModalOpen(true)}>+ Transaksi Baru</Button>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard label="Revenue Hari Ini" value={formatRupiah(daily?.total_revenue || 0)} />
        <MetricCard label="Transaksi Hari Ini" value={daily?.transaction_count || 0} />
        <MetricCard label="Rata-rata / Transaksi" value={formatRupiah(daily?.transaction_count ? daily.total_revenue / daily.transaction_count : 0)} />
      </div>

      <Card title="Tren Penjualan">
        {chartData.length ? <SalesLineChart data={chartData} /> : <p className="text-textmuted text-sm text-center py-10">Belum ada data</p>}
      </Card>

      <Card title="Riwayat Transaksi">
        <Table
          columns={[
            { key: 'transaction_id', label: 'ID' },
            { key: 'date', label: 'Tanggal', render: (r) => formatTanggalPendek(r.date) },
            { key: 'total', label: 'Total', render: (r) => formatRupiah(r.total) },
            { key: 'payment_method', label: 'Pembayaran' },
            { key: 'discount_amount', label: 'Diskon', render: (r) => (r.discount_amount ? formatRupiah(r.discount_amount) : '-') },
            { key: 'recorded_by', label: 'Dicatat oleh' },
          ]}
          rows={sales || []}
        />
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Transaksi Baru">
        <SalesForm
          products={productList || []}
          onSuccess={() => {
            setModalOpen(false);
            refetch();
          }}
        />
      </Modal>
    </div>
  );
}

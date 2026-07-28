'use client';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { api } from '@/lib/api';
import Card from '@/components/ui/Card';
import { formatRupiah } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();

  // Menarik ringkasan data harian bawaan sistem asli
  const { data: summary } = useData(() => api.getDailySummary(), []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Selamat Datang, {user?.full_name}</h1>
        <p className="text-sm text-textmuted">Berikut adalah ringkasan operasional Seblak Asik hari ini.</p>
      </div>

      {/* Grid Utama Ringkasan Hari Ini */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="💰 Total Pendapatan">
          <p className="text-2xl font-bold text-success">
            {summary ? formatRupiah(summary.total_revenue) : 'Rp 0'}
          </p>
          <p className="text-xs text-textmuted mt-1">Gabungan Cash & QRIS hari ini</p>
        </Card>

        <Card title="🛒 Total Transaksi">
          <p className="text-2xl font-bold text-white">
            {summary ? `${summary.transaction_count} Transaksi` : '0 Transaksi'}
          </p>
          <p className="text-xs text-textmuted mt-1">Jumlah nota POS yang terbit</p>
        </Card>

        <Card title="💳 Total QRIS / Transfer">
          <p className="text-2xl font-bold text-info">
            {summary ? formatRupiah(summary.total_qris) : 'Rp 0'}
          </p>
          <p className="text-xs text-textmuted mt-1">Pendapatan non-tunai hari ini</p>
        </Card>
      </div>

      {/* Rincian Metode Pembayaran */}
      <Card title="💳 Rincian Pembayaran Via">
        <div className="space-y-2">
          {summary && summary.by_payment_method ? (
            Object.keys(summary.by_payment_method).map((method) => (
              <div key={method} className="flex justify-between items-center border-b border-border/30 pb-2 text-sm">
                <span className="text-text">{method}</span>
                <span className="font-semibold text-white">{formatRupiah(summary.by_payment_method[method])}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-textmuted text-center py-4">Belum ada data transaksi masuk hari ini.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

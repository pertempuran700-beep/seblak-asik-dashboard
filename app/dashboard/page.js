'use client';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { api } from '@/lib/api';
import Card, { MetricCard } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import SalesBarChart from '@/components/charts/SalesBarChart';
import ProductDonutChart from '@/components/charts/ProductDonutChart';
import PaymentMethodChart from '@/components/charts/PaymentMethodChart';
import { formatRupiah, pctChangeLabel, currentMonthYear } from '@/lib/utils';

export default function OverviewPage() {
  const { user } = useAuth();
  const { month, year } = currentMonthYear();

  const { data: daily } = useData(() => api.getDailySummary(), []);
  const { data: monthly } = useData(() => api.getMonthlySummary(month, year), [month, year]);
  const { data: stock } = useData(() => api.getStockLevels(), []);
  const isOwnerOrAdmin = user?.role === 'owner' || user?.role === 'admin';
  const { data: metrics } = useData(
    () => (isOwnerOrAdmin ? api.getFinancialMetrics(`${year}-${String(month).padStart(2, '0')}`) : Promise.resolve(null)),
    [isOwnerOrAdmin, month, year]
  );

  const lowStock = (stock || []).filter((p) => p.level_status !== 'OK').slice(0, 5);
  const chartData = monthly?.top_products?.length
    ? [{ label: 'Bulan ini', revenue: monthly.total_revenue }]
    : [];

  const paymentData = daily?.by_payment_method
    ? Object.entries(daily.by_payment_method).map(([name, value]) => ({
        name,
        value: daily.total_revenue ? Math.round((value / daily.total_revenue) * 100) : 0,
      }))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Halo, {user?.full_name?.split(' ')[0]} 👋</h1>
        <p className="text-textmuted text-sm">Ringkasan operasional Seblak Asik hari ini</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Revenue Hari Ini" value={formatRupiah(daily?.total_revenue || 0)} change={daily ? `${daily.transaction_count} transaksi` : ''} />
        {metrics && (
          <>
            <MetricCard
              label="Net Profit Bulan Ini"
              value={formatRupiah(metrics.current.net_profit)}
              change={pctChangeLabel(metrics.changes.profit_pct)}
              changeType={metrics.changes.profit_pct >= 0 ? 'up' : 'down'}
            />
            <MetricCard
              label="COGS Bulan Ini"
              value={formatRupiah(metrics.current.cogs)}
              change={pctChangeLabel(metrics.changes.cogs_pct)}
              changeType={metrics.changes.cogs_pct <= 0 ? 'up' : 'down'}
            />
            <MetricCard
              label="OPEX Bulan Ini"
              value={formatRupiah(metrics.current.opex)}
              change={pctChangeLabel(metrics.changes.opex_pct)}
              changeType={metrics.changes.opex_pct <= 0 ? 'up' : 'down'}
            />
          </>
        )}
        {!metrics && (
          <MetricCard label="Revenue Bulan Ini" value={formatRupiah(monthly?.total_revenue || 0)} change={monthly ? `${monthly.transaction_count} transaksi` : ''} />
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Topping Terlaris Bulan Ini">
          {monthly?.top_products?.length ? (
            <ProductDonutChart data={monthly.top_products.slice(0, 6)} />
          ) : (
            <p className="text-textmuted text-sm text-center py-10">Belum ada data penjualan bulan ini</p>
          )}
        </Card>

        <Card title="Pembayaran Hari Ini">
          {paymentData.length ? (
            <PaymentMethodChart data={paymentData} />
          ) : (
            <p className="text-textmuted text-sm text-center py-10">Belum ada transaksi hari ini</p>
          )}
        </Card>
      </div>

      <Card title="⚠️ Stok Rendah">
        {lowStock.length === 0 ? (
          <p className="text-textmuted text-sm">Semua stok dalam kondisi aman ✅</p>
        ) : (
          <div className="space-y-2">
            {lowStock.map((p) => (
              <div key={p.product_id} className="flex items-center justify-between text-sm">
                <span>{p.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-textmuted">{p.current_stock} {p.unit} (min: {p.min_stock})</span>
                  <Badge variant={p.level_status === 'Critical' ? 'danger' : 'warning'}>{p.level_status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

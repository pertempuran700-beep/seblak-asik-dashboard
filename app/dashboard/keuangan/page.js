function CategoryBreakdownCard({ title, rows, itemLabel }) {
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
              <p className="text-xs text-textmuted uppercase mb-1">COGS (Stock In Produk)</p>
              <p className="text-xl font-bold text-info">{formatRupiah(report.cogs)}</p>
            </div>
            <div className="bg-surface2 p-4 rounded-card border-l-4 border-warning">
              <p className="text-xs text-textmuted uppercase mb-1">OPEX Variabel (Termasuk Biaya Lainnya)</p>
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
            <CategoryBreakdownCard title="📦 Pengeluaran Produk per Kategori (Stock In)" rows={report.stock_in_breakdown} />
            <CategoryBreakdownCard title="🧾 Pengeluaran Operasional per Kategori" rows={report.expense_breakdown} />
          </div>

          <Card title="⚖️ Head-to-Head: COGS Laporan Produk vs COGS Stock In">
            <p className="text-xs text-textmuted mb-3">
              Membandingkan biaya bahan baku yang seharusnya (dari HPP penjualan di Laporan Produk) dengan realisasi uang yang benar-benar dikeluarkan (dari Stock In), per kategori.
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

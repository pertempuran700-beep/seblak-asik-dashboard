'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { api } from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import SearchBar from '@/components/ui/SearchBar';
import Modal from '@/components/ui/Modal';
import Tabs from '@/components/ui/Tabs';
import StockInForm from '@/components/forms/StockInForm';
import ProductForm from '@/components/forms/ProductForm';
import WasteProductForm from '@/components/forms/WasteProductForm';
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

function WasteDashboard() {
  const { month: curMonth, year: curYear } = currentMonthYear();
  const [period, setPeriod] = useState(`${curYear}-${curMonth}`);
  const [year, month] = period.split('-').map(Number);

  const { data: report, loading } = useData(() => api.getWasteReport(month, year), [month, year]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-textmuted">Laporan waste produk per bulan</p>
        <div className="w-48">
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full bg-surface2 border border-white/[0.08] rounded-input px-3 py-2.5 text-sm text-text outline-none">
            {monthOptions().map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-center py-8 text-textmuted">Memuat laporan waste...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface2 p-4 rounded-card border-l-4 border-danger">
              <p className="text-xs text-textmuted uppercase mb-1">Total Nilai Waste</p>
              <p className="text-2xl font-bold text-danger">{formatRupiah(report?.total_waste_value || 0)}</p>
            </div>
            <div className="bg-surface2 p-4 rounded-card border-l-4 border-warning">
              <p className="text-xs text-textmuted uppercase mb-1">Total Item Terbuang</p>
              <p className="text-2xl font-bold text-warning">{report?.total_waste_qty || 0} unit</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card title="🔥 Produk Paling Sering Waste">
              <Table
                columns={[
                  { key: 'name', label: 'Produk' },
                  { key: 'category', label: 'Kategori' },
                  { key: 'qty', label: 'Jumlah' },
                  { key: 'value', label: 'Nilai Rugi', render: (r) => <span className="text-danger font-bold">{formatRupiah(r.value)}</span> },
                ]}
                rows={report?.top_waste_products || []}
                emptyMessage="Tidak ada waste bulan ini"
              />
            </Card>
            <Card title="📂 Breakdown per Kategori">
              <Table
                columns={[
                  { key: 'category', label: 'Kategori' },
                  { key: 'value', label: 'Nilai', render: (r) => <span className="text-danger font-bold">{formatRupiah(r.value)}</span> },
                ]}
                rows={report?.category_breakdown || []}
                emptyMessage="Tidak ada waste bulan ini"
              />
            </Card>
          </div>

          <Card title="📋 Detail Log Waste">
            <Table
              columns={[
                { key: 'date', label: 'Tanggal', render: (r) => new Date(r.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) },
                { key: 'product_name', label: 'Produk' },
                { key: 'category', label: 'Kategori' },
                { key: 'quantity', label: 'Jumlah', render: (r) => `${r.quantity} ${r.unit}` },
                { key: 'total_value', label: 'Nilai', render: (r) => formatRupiah(r.total_value) },
                { key: 'recorded_by', label: 'Dicatat Oleh' },
                { key: 'notes', label: 'Catatan' },
              ]}
              rows={report?.records || []}
              emptyMessage="Belum ada data waste"
            />
          </Card>
        </>
      )}
    </div>
  );
}

export default function StokPage() {
  const { user } = useAuth();
  const canEdit = user?.role === 'owner' || user?.role === 'admin';
  const { data: stock, loading, refetch } = useData(() => api.getStockLevels(), []);
  const { data: vendors } = useData(() => (canEdit ? api.listVendors() : Promise.resolve([])), [canEdit]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('stok');
  const [modal, setModal] = useState(null); // 'in' | 'product' | 'waste' | null
  const [editingProduct, setEditingProduct] = useState(null);

  const filtered = (stock || []).filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const criticalStock = (stock || []).filter((p) => p.current_stock <= p.min_stock);

 const columns = [
    { key: 'kode', label: 'Kode' },
    { key: 'name', label: 'Produk' },
    { key: 'category', label: 'Kategori' },
    { key: 'current_stock', label: 'Sisa Stok', render: (r) => <span className="font-bold text-lg">{r.current_stock}</span> },
    { key: 'sell_price', label: 'Harga Jual', render: (r) => formatRupiah(r.sell_price) },
    { key: 'hpp', label: 'HPP', render: (r) => formatRupiah(r.hpp) },
    {
      key: 'level_status',
      label: 'Status',
      render: (r) => (
        <Badge variant={r.level_status === 'OK' ? 'success' : r.level_status === 'Low' ? 'warning' : 'danger'}>
          {r.level_status}
        </Badge>
      ),
    },
    canEdit && {
      key: 'actions',
      label: '',
      render: (r) => (
        <Button variant="ghost" onClick={() => { setEditingProduct(r); setModal('product'); }}>
          Edit
        </Button>
      ),
    },
  ].filter(Boolean);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">📦 Stok Real-time</h1>
          <p className="text-textmuted text-sm">{stock?.length || 0} produk terdaftar dalam sistem Asik Farm</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" onClick={() => setModal('waste')}>♻️ Catat Waste</Button>
          {canEdit && (
            <>
              <Button variant="secondary" onClick={() => { setEditingProduct(null); setModal('product'); }}>+ Tambah Produk</Button>
              <Button onClick={() => setModal('in')}>📥 + Stok Masuk</Button>
            </>
          )}
        </div>
      </div>

      <Tabs
        tabs={[
          { value: 'stok', label: 'Data Stok' },
          { value: 'waste', label: '♻️ Dashboard Waste' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'stok' && (
        <>
          {criticalStock.length > 0 && (
            <Card title="⚠️ WARNING PRODUK!" className="border-l-4 border-l-danger bg-danger/5">
              <p className="text-sm text-textmuted mb-4">Produk di bawah ini telah melewati ambang batas minimal stok. Segera lakukan pengadaan (Stock In).</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {criticalStock.map((p, i) => (
              <div key={i} className="flex justify-between items-center bg-surface2 p-3 rounded-card border border-danger/30 shadow-sm transition-all hover:border-danger/60">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.current_stock <= 0 ? '🔴' : '🟡'}</span>
                  <div>
                    <p className="font-bold text-sm text-white truncate w-32">{p.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-danger text-xl">{p.current_stock}</p>
                </div>
              </div>
            ))}
          </div>
            </Card>
          )}

          <Card>
            <div className="mb-4 max-w-sm">
              <SearchBar value={search} onChange={setSearch} placeholder="Cari nama produk..." />
            </div>
            {loading ? (
              <p className="text-textmuted text-sm text-center py-8">Memuat sinkronisasi data stok...</p>
            ) : (
              <Table columns={columns} rows={filtered} emptyMessage="Produk tidak ditemukan" />
            )}
          </Card>
        </>
      )}

      {tab === 'waste' && <WasteDashboard />}

      <Modal open={modal === 'in'} onClose={() => setModal(null)} title="📥 Input Stok Masuk (Restock)">
        <StockInForm products={stock || []} vendors={vendors || []} onSuccess={() => { setModal(null); refetch(); }} onClose={() => setModal(null)} />
      </Modal>

      <Modal open={modal === 'product'} onClose={() => setModal(null)} title={editingProduct ? 'Edit Produk' : 'Tambah Produk'}>
        <ProductForm product={editingProduct} onSuccess={refetch} onClose={() => setModal(null)} />
      </Modal>

      <Modal open={modal === 'waste'} onClose={() => setModal(null)} title="♻️ Catat Waste Produk">
        <WasteProductForm products={stock || []} onSuccess={refetch} onClose={() => setModal(null)} />
      </Modal>
    </div>
  );
}

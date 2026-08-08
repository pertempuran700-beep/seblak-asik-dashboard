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
import StockInForm from '@/components/forms/StockInForm';
import ProductForm from '@/components/forms/ProductForm';
import { formatRupiah } from '@/lib/utils';

export default function StokPage() {
  const { user } = useAuth();
  const canEdit = user?.role === 'owner' || user?.role === 'admin';
  const { data: stock, loading, refetch } = useData(() => api.getStockLevels(), []);
  const { data: vendors } = useData(() => (canEdit ? api.listVendors() : Promise.resolve([])), [canEdit]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // 'in' | 'product' | null
  const [editingProduct, setEditingProduct] = useState(null);

  const filtered = (stock || []).filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  
  // Logika Filter Warning Produk Kritis
  const criticalStock = (stock || []).filter((p) => p.current_stock <= p.min_stock);

  // Kolom Tabel (Sisa Stok dipisah dengan Satuan Jual)
  const columns = [
    { key: 'kode', label: 'Kode' },
    { key: 'name', label: 'Produk' },
    { key: 'category', label: 'Kategori' },
    { key: 'current_stock', label: 'Sisa Stok', render: (r) => <span className="font-bold text-lg">{r.current_stock}</span> },
    { key: 'sell_unit', label: 'Satuan', render: (r) => <span className="text-textmuted uppercase text-xs tracking-wider">{r.sell_unit || '-'}</span> },
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
        {canEdit && (
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" onClick={() => { setEditingProduct(null); setModal('product'); }}>+ Tambah Produk</Button>
            <Button onClick={() => setModal('in')}>📥 + Stok Masuk</Button>
          </div>
        )}
      </div>

      {/* WARNING PRODUK KRITIS */}
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
                    <p className="text-xs text-textmuted">Batas Aman: {p.min_stock} {p.sell_unit}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-danger text-xl">{p.current_stock}</p>
                  <p className="text-[10px] uppercase tracking-wider text-danger font-bold">{p.sell_unit}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TABEL DATA STOK KESELURUHAN */}
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

      <Modal open={modal === 'in'} onClose={() => setModal(null)} title="📥 Input Stok Masuk (Restock)">
        <StockInForm
          products={stock || []}
          vendors={vendors || []}
          onSuccess={() => { setModal(null); refetch(); }}
          onClose={() => setModal(null)}
        />
      </Modal>

      <Modal open={modal === 'product'} onClose={() => setModal(null)} title={editingProduct ? 'Edit Produk' : 'Tambah Produk'}>
        <ProductForm
          product={editingProduct}
          onSuccess={refetch}
          onClose={() => setModal(null)}
        />
      </Modal>
    </div>
  );
}

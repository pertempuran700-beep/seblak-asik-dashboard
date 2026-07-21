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
import StockOutForm from '@/components/forms/StockOutForm';
import ProductForm from '@/components/forms/ProductForm';
import { formatRupiah } from '@/lib/utils';

export default function StokPage() {
  const { user } = useAuth();
  const canEdit = user?.role === 'owner' || user?.role === 'admin';
  const { data: stock, loading, refetch } = useData(() => api.getStockLevels(), []);
  const { data: vendors } = useData(() => (canEdit ? api.listVendors() : Promise.resolve([])), [canEdit]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // 'in' | 'out' | 'product' | null
  const [editingProduct, setEditingProduct] = useState(null);

  const filtered = (stock || []).filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const columns = [
    { key: 'kode', label: 'Kode' },
    { key: 'name', label: 'Produk' },
    { key: 'category', label: 'Kategori' },
    { key: 'current_stock', label: 'Sisa Stok', render: (r) => `${r.current_stock} ${r.sell_unit || ''}` },
    { key: 'sell_price', label: 'Harga Jual', render: (r) => formatRupiah(r.sell_price) },
    { key: 'hpp', label: 'HPP', render: (r) => formatRupiah(r.hpp) },
    { key: 'margin_pct', label: 'Margin', render: (r) => `${r.margin_pct.toFixed(0)}%` },
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">📦 Stok Real-time</h1>
          <p className="text-textmuted text-sm">{stock?.length || 0} produk terdaftar</p>
        </div>
        {canEdit && (
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" onClick={() => { setEditingProduct(null); setModal('product'); }}>+ Produk</Button>
            <Button variant="secondary" onClick={() => setModal('out')}>+ Stok Keluar</Button>
            <Button onClick={() => setModal('in')}>+ Stok Masuk</Button>
          </div>
        )}
      </div>

      <Card>
        <div className="mb-4 max-w-sm">
          <SearchBar value={search} onChange={setSearch} placeholder="Cari produk..." />
        </div>
        {loading ? (
          <p className="text-textmuted text-sm text-center py-8">Memuat data stok...</p>
        ) : (
          <Table columns={columns} rows={filtered} emptyMessage="Produk tidak ditemukan" />
        )}
      </Card>

      <Modal open={modal === 'in'} onClose={() => setModal(null)} title="Input Stok Masuk">
        <StockInForm
          products={stock || []}
          vendors={vendors || []}
          onSuccess={() => { setModal(null); refetch(); }}
        />
      </Modal>

      <Modal open={modal === 'out'} onClose={() => setModal(null)} title="Input Stok Keluar">
        <StockOutForm
          products={stock || []}
          onSuccess={() => { setModal(null); refetch(); }}
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

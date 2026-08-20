'use client';
import { useState, useMemo } from 'react';
import Button from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { api } from '@/lib/api';
import { useToast } from '../ui/Toast';
import { formatRupiah } from '@/lib/utils';

export default function ProductForm({ product, products, onSuccess, onClose }) {
  const isEdit = Boolean(product);
  const [form, setForm] = useState({
    kode: product?.kode || '',
    name: product?.name || '',
    cashierName: product?.cashier_name || '',
    brand: product?.brand || '',
    category: product?.category || '',
    berat: product?.weight || '',
    hargaBeli: product?.buy_price || '',
    isi: product?.content_qty || '',
    satuan: product?.unit || '',
    satuanJual: product?.sell_unit || '',
    hargaJual: product?.sell_price || '',
    minStok: product?.min_stock || 5,
  });
  const [useNewCategory, setUseNewCategory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const categories = useMemo(() => {
    const set = new Set((products || []).map((p) => p.category).filter(Boolean));
    return Array.from(set).sort();
  }, [products]);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const computedHpp = Number(form.isi) > 0 && form.hargaBeli
    ? Math.round(Number(form.hargaBeli) / Number(form.isi))
    : 0;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEdit) {
        await api.updateProduct(product.product_id, form);
        toast?.showToast('Produk berhasil diperbarui');
      } else {
        await api.createProduct(form);
        toast?.showToast('Produk baru berhasil ditambahkan');
      }
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toast?.showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Kode (kosongkan = auto)" placeholder="mis. tl001" value={form.kode} disabled={isEdit} onChange={(e) => set('kode', e.target.value)} />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs text-textmuted">Kategori</label>
            <button type="button" onClick={() => { setUseNewCategory(!useNewCategory); set('category', ''); }} className="text-[10px] text-primary hover:underline">
              {useNewCategory ? 'Pilih dari daftar' : '+ Kategori baru'}
            </button>
          </div>
          {useNewCategory ? (
            <Input placeholder="Ketik kategori baru" required value={form.category} onChange={(e) => set('category', e.target.value)} />
          ) : (
            <Select
              required
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              options={[{ value: '', label: '-- Pilih Kategori --' }, ...categories.map((c) => ({ value: c, label: c }))]}
            />
          )}
        </div>
      </div>

      <Input label="Nama Produk" required value={form.name} onChange={(e) => set('name', e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Merek" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
        <Input label="Nama di Kasir" placeholder="default = Nama Produk" value={form.cashierName} onChange={(e) => set('cashierName', e.target.value)} />
      </div>

      <p className="text-xs text-textmuted pt-1">Konversi satuan beli → satuan jual</p>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Satuan Beli" placeholder="mis. karton, bal" value={form.satuan} onChange={(e) => set('satuan', e.target.value)} />
        <Input label="isi per Satuan Beli" type="number" min="0" placeholder="mis. 500" value={form.isi} onChange={(e) => set('isi', e.target.value)} />
      </div>
      <Input label="Satuan Jual" placeholder="mis. pcs, porsi, gram" value={form.satuanJual} onChange={(e) => set('satuanJual', e.target.value)} />

      <p className="text-xs text-textmuted pt-1">Harga & HPP</p>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Harga Beli / Satuan Beli" type="number" min="0" value={form.hargaBeli} onChange={(e) => set('hargaBeli', e.target.value)} />
        <Input label="Harga Jual / Satuan Jual" type="number" min="0" required value={form.hargaJual} onChange={(e) => set('hargaJual', e.target.value)} />
      </div>

      <div className="bg-surface2 border border-white/[0.08] rounded-input px-3 py-3">
        <p className="text-xs text-textmuted mb-1">HPP / Satuan Jual (otomatis)</p>
        <p className="text-lg font-bold text-success">{formatRupiah(computedHpp)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Berat (opsional)" value={form.berat} onChange={(e) => set('berat', e.target.value)} />
        <Input label="Min. Stok (alert)" type="number" min="0" value={form.minStok} onChange={(e) => set('minStok', e.target.value)} />
      </div>

      <Button type="submit" full disabled={submitting}>
        {submitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}
      </Button>
    </form>
  );
}

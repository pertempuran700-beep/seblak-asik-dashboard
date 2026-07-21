'use client';
import { useState } from 'react';
import Button from '../ui/Button';
import { Input } from '../ui/Input';
import { api } from '@/lib/api';
import { useToast } from '../ui/Toast';

export default function ProductForm({ product, onSuccess, onClose }) {
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
    hpp: product?.hpp || '',
    minStok: product?.min_stock || 5,
  });
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

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
        <Input
          label="Kode (kosongkan = auto)"
          placeholder="mis. tl001"
          value={form.kode}
          disabled={isEdit}
          onChange={(e) => set('kode', e.target.value)}
        />
        <Input label="Kategori" placeholder="mis. Telur, Plastik, Minuman" required value={form.category} onChange={(e) => set('category', e.target.value)} />
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
      <Input label="Satuan Jual" placeholder="mis. pcs, porsi" value={form.satuanJual} onChange={(e) => set('satuanJual', e.target.value)} />

      <p className="text-xs text-textmuted pt-1">Harga & HPP</p>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Harga Beli / Satuan Beli" type="number" min="0" value={form.hargaBeli} onChange={(e) => set('hargaBeli', e.target.value)} />
        <Input label="Harga Jual / Satuan Jual" type="number" min="0" required value={form.hargaJual} onChange={(e) => set('hargaJual', e.target.value)} />
      </div>
      <Input
        label="HPP / Satuan Jual (manual)"
        type="number" min="0"
        placeholder="Harga pokok per pcs — Anda isi sendiri"
        value={form.hpp}
        onChange={(e) => set('hpp', e.target.value)}
      />

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

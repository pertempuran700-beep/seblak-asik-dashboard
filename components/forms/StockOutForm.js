'use client';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

const REASONS = ['Damaged', 'Expired', 'Return', 'Internal Use'].map((r) => ({ value: r, label: r }));

export default function StockOutForm({ products, onSuccess, onClose }) {
  const [form, setForm] = useState({ productId: products[0]?.product_id || '', quantity: '', reason: 'Damaged', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.addStockOut(form.productId, Number(form.quantity), form.reason, '');
      toast?.showToast('Stok keluar berhasil dicatat');
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
      <Select
        label="Produk"
        options={products.map((p) => ({ value: p.product_id, label: p.name + ' (sisa ' + p.current_stock + ')' }))}
        value={form.productId}
        onChange={(e) => set('productId', e.target.value)}
      />
      <Input label="Jumlah" type="number" min="1" required value={form.quantity} onChange={(e) => set('quantity', e.target.value)} />
      <Select label="Alasan" options={REASONS} value={form.reason} onChange={(e) => set('reason', e.target.value)} />
      <Button type="submit" full disabled={submitting}>
        {submitting ? 'Menyimpan...' : 'Simpan Stok Keluar'}
      </Button>
    </form>
  );
}

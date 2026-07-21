'use client';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

const CATEGORIES = ['Sewa', 'Utilitas', 'Peralatan', 'Bahan Baku', 'Marketing', 'Lainnya'].map((c) => ({ value: c, label: c }));
const METHODS = ['Cash', 'Transfer'].map((m) => ({ value: m, label: m }));

export default function ExpenseForm({ onSuccess, onClose }) {
  const [form, setForm] = useState({ category: 'Bahan Baku', description: '', amount: '', paymentMethod: 'Cash' });
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createExpense(form.category, form.description, Number(form.amount), form.paymentMethod);
      toast?.showToast('Pengeluaran berhasil dicatat');
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
      <Select label="Kategori" options={CATEGORIES} value={form.category} onChange={(e) => set('category', e.target.value)} />
      <Input label="Deskripsi" required value={form.description} onChange={(e) => set('description', e.target.value)} />
      <Input label="Nominal (Rp)" type="number" min="0" required value={form.amount} onChange={(e) => set('amount', e.target.value)} />
      <Select label="Metode Pembayaran" options={METHODS} value={form.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value)} />
      <Button type="submit" full disabled={submitting}>
        {submitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}
      </Button>
    </form>
  );
}

'use client';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

export default function PromoForm({ onSuccess, onClose }) {
  const [form, setForm] = useState({
    name: '', code: '', type: 'percentage', value: '', minPurchase: '',
    startDate: new Date().toISOString().slice(0, 10), endDate: '',
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
      await api.createPromo(
        form.name, form.code, form.type, Number(form.value),
        form.startDate, form.endDate, form.minPurchase ? Number(form.minPurchase) : null
      );
      toast?.showToast('Promo "' + form.name + '" berhasil dibuat');
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
      <Input label="Nama Promo" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Diskon Weekend" />
      <Input label="Kode Promo (opsional)" value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="ASIK10" />
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Jenis Diskon"
          options={[{ value: 'percentage', label: 'Persentase (%)' }, { value: 'fixed', label: 'Nominal (Rp)' }]}
          value={form.type}
          onChange={(e) => set('type', e.target.value)}
        />
        <Input
          label={form.type === 'percentage' ? 'Nilai (%)' : 'Nilai (Rp)'}
          type="number" required value={form.value} onChange={(e) => set('value', e.target.value)}
        />
      </div>
      <Input label="Minimum Pembelian (opsional)" type="number" value={form.minPurchase} onChange={(e) => set('minPurchase', e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Tanggal Mulai" type="date" required value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
        <Input label="Tanggal Berakhir" type="date" required value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
      </div>
      <Button type="submit" full disabled={submitting}>
        {submitting ? 'Menyimpan...' : 'Buat Promo'}
      </Button>
    </form>
  );
}

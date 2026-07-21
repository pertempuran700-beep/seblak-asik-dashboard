'use client';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

const TYPES = ['Attendance', 'Sales Target', 'Performance', 'Custom'].map((t) => ({ value: t, label: t }));

export default function BonusConfigForm({ onSuccess, onClose }) {
  const [form, setForm] = useState({
    bonusName: '', type: 'Attendance', conditionDesc: '', conditionValue: '', amount: '', period: 'Monthly',
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
      await api.createBonusConfig(form.bonusName, form.type, form.conditionDesc, Number(form.conditionValue), Number(form.amount), form.period);
      toast?.showToast('Aturan bonus "' + form.bonusName + '" berhasil disimpan');
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
      <Input label="Nama Bonus" required value={form.bonusName} onChange={(e) => set('bonusName', e.target.value)} placeholder="Bonus Rajin Hadir" />
      <Select label="Tipe" options={TYPES} value={form.type} onChange={(e) => set('type', e.target.value)} />
      <Input
        label="Deskripsi Syarat"
        value={form.conditionDesc}
        onChange={(e) => set('conditionDesc', e.target.value)}
        placeholder="Hadir penuh tanpa telat dalam sebulan"
      />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Nilai Threshold" type="number" required value={form.conditionValue} onChange={(e) => set('conditionValue', e.target.value)} placeholder="26" />
        <Input label="Nominal Bonus (Rp)" type="number" required value={form.amount} onChange={(e) => set('amount', e.target.value)} />
      </div>
      <Select label="Periode" options={[{ value: 'Monthly', label: 'Bulanan' }, { value: 'Quarterly', label: 'Triwulan' }]} value={form.period} onChange={(e) => set('period', e.target.value)} />
      <Button type="submit" full disabled={submitting}>
        {submitting ? 'Menyimpan...' : 'Simpan Aturan Bonus'}
      </Button>
    </form>
  );
}

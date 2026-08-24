'use client';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { currentMonthYear } from '@/lib/utils';

export default function MarketingCostForm({ onSuccess, onClose }) {
  const { month, year } = currentMonthYear();
  const [period, setPeriod] = useState(`${year}-${String(month).padStart(2, '0')}`);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createMarketingCost(period, Number(amount), notes);
      toast?.showToast('Biaya marketing berhasil dicatat');
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
      <Input label="Bulan & Tahun" type="month" required value={period} onChange={(e) => setPeriod(e.target.value)} />
      <Input label="Jumlah Biaya Marketing (Rp)" type="number" min="0" required value={amount} onChange={(e) => setAmount(e.target.value)} />
      <Input label="Catatan (opsional)" placeholder="mis. Iklan Instagram, endorse" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <p className="text-xs text-textmuted">Jika bulan yang sama sudah pernah diisi, data lama akan otomatis diperbarui.</p>
      <Button type="submit" full disabled={submitting || !amount}>
        {submitting ? 'Menyimpan...' : 'Simpan Biaya Marketing'}
      </Button>
    </form>
  );
}

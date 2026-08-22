'use client';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

export default function OtherCostExpenseForm({ items, onSuccess, onClose }) {
  const [itemId, setItemId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const activeItems = (items || []).filter((i) => i.is_active === true || i.is_active === 'TRUE');
  const selectedItem = activeItems.find((i) => i.item_id === itemId);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createOtherCostExpense(itemId, Number(amount), notes);
      toast?.showToast('Biaya lainnya berhasil dicatat');
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
        label="Pilih Item"
        required
        value={itemId}
        onChange={(e) => setItemId(e.target.value)}
        options={[{ value: '', label: '-- Pilih Item --' }, ...activeItems.map((i) => ({ value: i.item_id, label: i.item_name }))]}
      />
      {selectedItem && (
        <p className="text-xs text-textmuted">
          Kategori: <span className={`font-bold ${selectedItem.category === 'Bumbu' ? 'text-warning' : 'text-textmuted'}`}>{selectedItem.category || 'Lain-lain'}</span>
          {' — '}{selectedItem.category === 'Bumbu' ? 'akan masuk ke COGS' : 'akan masuk ke OPEX Variabel'}
        </p>
      )}
      <Input label="Nominal (Rp)" type="number" min="0" required value={amount} onChange={(e) => setAmount(e.target.value)} />
      <Input label="Catatan (opsional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <Button type="submit" full disabled={submitting || !itemId}>
        {submitting ? 'Menyimpan...' : 'Catat Biaya'}
      </Button>
    </form>
  );
}

'use client';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

export default function ManageOtherCostItemsForm({ items, onSuccess }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  async function handleAdd(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createOtherCostItem(name, desc);
      toast?.showToast('Item baru ditambahkan');
      setName(''); setDesc('');
      onSuccess?.();
    } catch (err) {
      toast?.showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex gap-2 items-end">
        <div className="flex-1"><Input label="Nama Item Baru" placeholder="mis. Kantong Kresek" required value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="flex-1"><Input label="Deskripsi (opsional)" value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        <Button type="submit" disabled={submitting || !name}>+ Tambah</Button>
      </form>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {(items || []).map((i) => (
          <div key={i.item_id} className="flex justify-between items-center bg-surface2 p-2.5 rounded-input text-sm">
            <div>
              <p className="font-medium">{i.item_name}</p>
              {i.description && <p className="text-xs text-textmuted">{i.description}</p>}
            </div>
            <span className={`text-xs font-bold ${i.is_active === true || i.is_active === 'TRUE' ? 'text-success' : 'text-textmuted'}`}>
              {i.is_active === true || i.is_active === 'TRUE' ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

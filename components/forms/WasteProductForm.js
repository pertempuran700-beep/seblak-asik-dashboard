'use client';
import { useState, useMemo } from 'react';
import Button from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

export default function WasteProductForm({ products, onSuccess, onClose }) {
  const [category, setCategory] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const categories = useMemo(() => {
    const set = new Set((products || []).map((p) => p.category).filter(Boolean));
    return Array.from(set).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!category) return [];
    return (products || []).filter((p) => p.category === category);
  }, [products, category]);

  const selectedProduct = filteredProducts.find((p) => p.product_id === productId);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!productId || !quantity) {
      toast?.showToast('Lengkapi semua kolom', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.addWasteProduct(productId, Number(quantity), notes);
      toast?.showToast(`Waste tercatat: -${quantity} ${selectedProduct?.sell_unit || ''} ${selectedProduct?.name || ''}`);
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
      <div className="bg-warning/10 border border-warning/20 p-3 rounded-card text-xs text-warning">
        ♻️ Catat produk yang rusak/terbuang di sini. Stok akan otomatis berkurang.
      </div>

      <Select
        label="1. Pilih Kategori"
        required
        value={category}
        onChange={(e) => { setCategory(e.target.value); setProductId(''); setQuantity(''); }}
        options={[{ value: '', label: '-- Pilih Kategori --' }, ...categories.map((c) => ({ value: c, label: c }))]}
      />

      <Select
        label="2. Pilih Produk"
        required
        value={productId}
        onChange={(e) => setProductId(e.target.value)}
        disabled={!category}
        options={[
          { value: '', label: category ? '-- Pilih Produk --' : 'Pilih kategori dulu' },
          ...filteredProducts.map((p) => ({ value: p.product_id, label: `${p.name} (sisa ${p.current_stock} ${p.sell_unit})` })),
        ]}
      />

      {selectedProduct && (
        <Input
          label={`3. Jumlah Waste (${selectedProduct.sell_unit})`}
          type="number" min="1" max={selectedProduct.current_stock} required
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      )}

      <Input label="Catatan (opsional)" placeholder="mis. Basi, jatuh, kadaluarsa" value={notes} onChange={(e) => setNotes(e.target.value)} />

      <Button type="submit" full disabled={submitting || !productId || !quantity}>
        {submitting ? 'Menyimpan...' : '♻️ Catat Waste Produk'}
      </Button>
    </form>
  );
}

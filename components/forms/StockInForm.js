'use client';
import { useState, useMemo } from 'react';
import Button from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { formatRupiah } from '@/lib/utils';

export default function StockInForm({ products, vendors, onSuccess, onClose }) {
  const [form, setForm] = useState({
    productId: products[0]?.product_id || '',
    vendorId: vendors[0]?.vendor_id || '',
    qtyBeli: '',
    hargaBeli: '',
    paymentStatus: 'Lunas',
    dueDate: '',
    invoiceNo: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const selectedProduct = products.find((p) => p.product_id === form.productId);
  const isi = Number(selectedProduct?.content_qty) || 0;
  const convertedQty = isi > 0 && form.qtyBeli ? Number(form.qtyBeli) * isi : 0;

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await api.addStockIn(
        form.productId, form.vendorId, Number(form.qtyBeli), Number(form.hargaBeli),
        form.paymentStatus, form.dueDate || null, form.invoiceNo
      );
      toast?.showToast(`Stok masuk dicatat: +${result.quantity_converted} ${selectedProduct?.sell_unit || 'unit'}`);
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
        options={products.map((p) => ({ value: p.product_id, label: `${p.name} (${p.kode})` }))}
        value={form.productId}
        onChange={(e) => set('productId', e.target.value)}
      />
      <Select
        label="Vendor"
        options={vendors.map((v) => ({ value: v.vendor_id, label: v.vendor_name }))}
        value={form.vendorId}
        onChange={(e) => set('vendorId', e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label={`Jumlah (${selectedProduct?.unit || 'satuan beli'})`}
          type="number" min="1" required
          value={form.qtyBeli}
          onChange={(e) => set('qtyBeli', e.target.value)}
        />
        <Input
          label={`Harga / ${selectedProduct?.unit || 'satuan beli'}`}
          type="number" min="0" required
          value={form.hargaBeli}
          onChange={(e) => set('hargaBeli', e.target.value)}
        />
      </div>

      {isi > 0 && form.qtyBeli && (
        <p className="text-xs text-textmuted bg-surface2 rounded-input px-3 py-2">
          1 {selectedProduct.unit} = {isi} {selectedProduct.sell_unit} → stok bertambah{' '}
          <span className="text-text font-bold">{convertedQty} {selectedProduct.sell_unit}</span>
          {form.hargaBeli && (
            <> · Total biaya: <span className="text-text font-bold">{formatRupiah(Number(form.qtyBeli) * Number(form.hargaBeli))}</span></>
          )}
        </p>
      )}
      {isi === 0 && selectedProduct && (
        <p className="text-xs text-warning bg-warning/10 rounded-input px-3 py-2">
          ⚠️ Kolom "isi" produk ini belum diisi di sheet Products (konversi ke satuan jual akan 0). Isi dulu kolom "isi" di sheet untuk produk ini.
        </p>
      )}

      <Input label="No. Faktur" value={form.invoiceNo} onChange={(e) => set('invoiceNo', e.target.value)} />
      <Select
        label="Status Pembayaran"
        options={[{ value: 'Lunas', label: 'Lunas' }, { value: 'Belum Lunas', label: 'Belum Lunas (Hutang)' }]}
        value={form.paymentStatus}
        onChange={(e) => set('paymentStatus', e.target.value)}
      />
      {form.paymentStatus === 'Belum Lunas' && (
        <Input label="Jatuh Tempo" type="date" required value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
      )}
      <Button type="submit" full disabled={submitting}>
        {submitting ? 'Menyimpan...' : 'Simpan Stok Masuk'}
      </Button>
    </form>
  );
}

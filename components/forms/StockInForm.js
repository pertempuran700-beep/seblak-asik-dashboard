'use client';
import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { formatRupiah } from '@/lib/utils';

export default function StockInForm({ products, vendors, onSuccess, onClose }) {
  const [form, setForm] = useState({
    kodeProduk: '',
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

  // Otomatis mencari produk saat kode diketik
  useEffect(() => {
    if (form.kodeProduk) {
      const match = products.find(p => 
        p.kode?.toLowerCase() === form.kodeProduk.toLowerCase() || 
        p.product_id === form.kodeProduk
      );
      if (match) {
        setForm(prev => ({
          ...prev,
          productId: match.product_id,
          hargaBeli: match.buy_price || prev.hargaBeli
        }));
      }
    }
  }, [form.kodeProduk, products]);

  const finalProductId = form.productId || products[0]?.product_id;
  const selectedProduct = products.find((p) => p.product_id === finalProductId);
  
  const isi = Number(selectedProduct?.content_qty) || 0;
    const convertedQty = isi > 0 && form.qtyBeli ? Math.round(Number(form.qtyBeli) * isi) : 0;

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await api.addStockIn(
        finalProductId, form.vendorId, Number(form.qtyBeli), Number(form.hargaBeli),
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-surface2 p-3 rounded-card border border-white/[0.08] mb-2">
        <Input 
          label="Ketik / Scan Kode Produk" 
          placeholder="mis. tl001" 
          value={form.kodeProduk} 
          onChange={(e) => set('kodeProduk', e.target.value)} 
        />
        <p className="text-xs text-textmuted mt-2">
          *Atau pilih manual dari daftar di bawah jika tidak hafal kode.
        </p>
      </div>

      <Select
        label="Nama Produk"
        options={products.map((p) => ({ value: p.product_id, label: `${p.name} (${p.kode})` }))}
        value={finalProductId}
        onChange={(e) => set('productId', e.target.value)}
      />
      <Select
        label="Vendor (Supplier)"
        options={vendors.map((v) => ({ value: v.vendor_id, label: v.vendor_name }))}
        value={form.vendorId}
        onChange={(e) => set('vendorId', e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label={`Jumlah Beli (${selectedProduct?.unit || 'satuan'})`}
          type="number" min="1" required
          value={form.qtyBeli}
          onChange={(e) => set('qtyBeli', e.target.value)}
        />
        <Input
          label={`Harga Beli / ${selectedProduct?.unit || 'satuan'}`}
          type="number" min="0" required
          value={form.hargaBeli}
          onChange={(e) => set('hargaBeli', e.target.value)}
        />
      </div>

            {isi > 0 && form.qtyBeli && (
        <p className="text-xs text-textmuted bg-surface2 rounded-input px-3 py-2 border-l-2 border-success">
          Gudang akan bertambah{' '}
          <span className="text-text font-bold text-success">{convertedQty}</span>
          {form.hargaBeli && (
            <> · Total Tagihan: <span className="text-text font-bold">{formatRupiah(Number(form.qtyBeli) * Number(form.hargaBeli))}</span></>
          )}
        </p>
      )}

      <Input label="No. Faktur / Nota" value={form.invoiceNo} onChange={(e) => set('invoiceNo', e.target.value)} />
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
        {submitting ? 'Memproses...' : 'Simpan Stok Masuk'}
      </Button>
    </form>
  );
}

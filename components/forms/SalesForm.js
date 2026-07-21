'use client';
import { useState, useMemo } from 'react';
import Button from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { formatRupiah } from '@/lib/utils';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

const PAYMENT_METHODS = [
  { value: 'QRIS', label: 'QRIS' },
  { value: 'Cash', label: 'Cash' },
  { value: 'Shopee Transfer', label: 'Shopee Transfer' },
];

export default function SalesForm({ products, onSuccess }) {
  const [cart, setCart] = useState([]); // [{ productId, name, price, quantity }]
  const [paymentMethod, setPaymentMethod] = useState('QRIS');
  const [promoCode, setPromoCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.product_id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.product_id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        { productId: product.product_id, name: product.name, price: Number(product.sell_price), quantity: 1 },
      ];
    });
  }

  function updateQty(productId, qty) {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setCart((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i)));
  }

  async function handleSubmit() {
    if (cart.length === 0) {
      toast?.showToast('Keranjang masih kosong', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const items = cart.map((i) => ({ productId: i.productId, quantity: i.quantity }));
      const result = await api.createSale(items, paymentMethod, promoCode || null, customerName || null);
      toast?.showToast('Transaksi ' + result.transaction_id + ' berhasil disimpan');
      setCart([]);
      setPromoCode('');
      setCustomerName('');
      onSuccess?.(result);
    } catch (err) {
      toast?.showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const categories = ['Topping', 'Minuman', 'Paketan'];

  return (
    <div className="grid md:grid-cols-3 gap-5">
      {/* Product picker */}
      <div className="md:col-span-2 space-y-5">
        {categories.map((cat) => {
          const items = products.filter((p) => p.category === cat && p.status === 'Active');
          if (items.length === 0) return null;
          return (
            <div key={cat}>
              <h4 className="text-sm font-bold text-textmuted mb-2">{cat}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {items.map((p) => (
                  <button
                    key={p.product_id}
                    onClick={() => addToCart(p)}
                    disabled={Number(p.current_stock) <= 0}
                    className="text-left bg-surface2 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed rounded-input p-3 transition-smooth"
                  >
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-textmuted">{formatRupiah(p.sell_price)}</p>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart / checkout */}
      <div className="bg-surface2 rounded-card p-4 h-fit space-y-3">
        <h4 className="font-bold text-sm">Keranjang</h4>
        {cart.length === 0 ? (
          <p className="text-textmuted text-sm">Pilih topping / minuman di sebelah kiri</p>
        ) : (
          <div className="space-y-2">
            {cart.map((item) => (
              <div key={item.productId} className="flex items-center justify-between text-sm">
                <span className="flex-1">{item.name}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQty(item.productId, item.quantity - 1)}
                    className="w-6 h-6 bg-surface rounded text-textmuted hover:text-text"
                  >
                    −
                  </button>
                  <span className="w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.productId, item.quantity + 1)}
                    className="w-6 h-6 bg-surface rounded text-textmuted hover:text-text"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-white/[0.08] pt-3 flex justify-between font-bold">
          <span>Subtotal</span>
          <span>{formatRupiah(subtotal)}</span>
        </div>

        <Input
          label="Kode Promo (opsional)"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
          placeholder="ASIK10"
        />
        <Input
          label="Nama Pelanggan (opsional)"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />
        <Select
          label="Metode Pembayaran"
          options={PAYMENT_METHODS}
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        />

        <Button full disabled={submitting || cart.length === 0} onClick={handleSubmit}>
          {submitting ? 'Menyimpan...' : 'Simpan Transaksi'}
        </Button>
      </div>
    </div>
  );
}

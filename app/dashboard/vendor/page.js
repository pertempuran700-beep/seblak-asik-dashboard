'use client';
import { useState } from 'react';
import { useData } from '@/hooks/useData';
import { api } from '@/lib/api';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

function VendorForm({ vendor, onSuccess, onClose }) {
  const isEdit = Boolean(vendor);
  const [form, setForm] = useState({
    vendor_name: vendor?.vendor_name || '',
    address: vendor?.address || '',
    pic_name: vendor?.pic_name || '',
    pic_position: vendor?.pic_position || '',
    pic_phone: vendor?.pic_phone || '',
    email: vendor?.email || '',
    products_supplied: vendor?.products_supplied || '',
    payment_terms: vendor?.payment_terms || '',
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
      if (isEdit) {
        await api.updateVendor(vendor.vendor_id, form);
        toast?.showToast('Vendor berhasil diperbarui');
      } else {
        await api.createVendor(form);
        toast?.showToast('Vendor baru berhasil ditambahkan');
      }
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
      <Input label="Nama Vendor" required value={form.vendor_name} onChange={(e) => set('vendor_name', e.target.value)} />
      <Input label="Alamat" value={form.address} onChange={(e) => set('address', e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Nama PIC" value={form.pic_name} onChange={(e) => set('pic_name', e.target.value)} />
        <Input label="Jabatan PIC" value={form.pic_position} onChange={(e) => set('pic_position', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="No. HP PIC" value={form.pic_phone} onChange={(e) => set('pic_phone', e.target.value)} />
        <Input label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
      </div>
      <Input label="Produk yang Disupply" value={form.products_supplied} onChange={(e) => set('products_supplied', e.target.value)} />
      <Input label="Termin Pembayaran" placeholder="COD / Net 30 / dll" value={form.payment_terms} onChange={(e) => set('payment_terms', e.target.value)} />
      <Button type="submit" full disabled={submitting}>
        {submitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Vendor'}
      </Button>
    </form>
  );
}

export default function VendorPage() {
  const { data: vendors, loading, refetch } = useData(() => api.listVendors(), []);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const columns = [
    { key: 'vendor_name', label: 'Nama Vendor' },
    { key: 'pic_name', label: 'PIC' },
    { key: 'pic_phone', label: 'No. HP' },
    { key: 'products_supplied', label: 'Produk' },
    { key: 'payment_terms', label: 'Termin' },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <Button variant="ghost" onClick={() => { setEditing(r); setModal(true); }}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">🏭 Vendor Management</h1>
        <Button onClick={() => { setEditing(null); setModal(true); }}>+ Tambah Vendor</Button>
      </div>

      <Card>
        {loading ? <p className="text-textmuted text-sm text-center py-8">Memuat...</p> : <Table columns={columns} rows={vendors || []} />}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Vendor' : 'Tambah Vendor'}>
        <VendorForm vendor={editing} onSuccess={refetch} onClose={() => setModal(false)} />
      </Modal>
    </div>
  );
}

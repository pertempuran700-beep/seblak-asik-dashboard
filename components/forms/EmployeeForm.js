'use client';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

const ROLES = [
  { value: 'employee', label: 'Karyawan' },
  { value: 'admin', label: 'Admin Support' },
  { value: 'owner', label: 'Owner' },
];

export default function EmployeeForm({ employee, onSuccess, onClose }) {
  const isEdit = Boolean(employee);
  const [form, setForm] = useState({
    full_name: employee?.full_name || '',
    position: employee?.position || '',
    base_salary: employee?.base_salary || '',
    bank_name: employee?.bank_name || '',
    bank_account: employee?.bank_account || '',
    phone: employee?.phone || '',
    email: employee?.email || '',
    role: employee?.role || 'employee',
    join_date: employee?.join_date || new Date().toISOString().slice(0, 10),
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
        await api.updateEmployee(employee.employee_id, form);
        toast?.showToast('Data karyawan berhasil diperbarui');
      } else {
        await api.createEmployee(form);
        toast?.showToast('Karyawan baru berhasil ditambahkan');
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
      <Input label="Nama Lengkap" required value={form.full_name} onChange={(e) => set('full_name', e.target.value)} />
      <Input label="Jabatan" required value={form.position} onChange={(e) => set('position', e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Gaji Pokok (Rp)" type="number" required value={form.base_salary} onChange={(e) => set('base_salary', e.target.value)} />
        <Select label="Role" options={ROLES} value={form.role} onChange={(e) => set('role', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Bank" value={form.bank_name} onChange={(e) => set('bank_name', e.target.value)} />
        <Input label="No. Rekening" value={form.bank_account} onChange={(e) => set('bank_account', e.target.value)} />
      </div>
      <Input label="No. HP" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
      <Input label="Email (untuk login)" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} />
      <Input label="Tanggal Bergabung" type="date" value={form.join_date} onChange={(e) => set('join_date', e.target.value)} />
      <Button type="submit" full disabled={submitting}>
        {submitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Karyawan'}
      </Button>
    </form>
  );
}

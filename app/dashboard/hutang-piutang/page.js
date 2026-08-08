'use client';
import { useState } from 'react';
import { useData } from '@/hooks/useData';
import { api } from '@/lib/api';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Tabs from '@/components/ui/Tabs';
import { Input, Select } from '@/components/ui/Input';
import { formatRupiah, currentMonthYear } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

// -----------------------------------------------------
// KOMPONEN: Form Modal Pembayaran Eksternal
// -----------------------------------------------------
function PaymentModal({ record, onClose, onSuccess }) {
  const [amount, setAmount] = useState(record?.remaining || '');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.recordPayment(record.record_id, Number(amount));
      toast?.showToast('Pembayaran tercatat');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toast?.showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={Boolean(record)} onClose={onClose} title={`Catat Pembayaran — ${record?.counterparty}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <p className="text-sm text-textmuted">Sisa tagihan: <span className="font-bold text-white">{formatRupiah(record?.remaining)}</span></p>
        <Input label="Jumlah Dibayar (Rp)" type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Button type="submit" full disabled={submitting} className="mt-4">
          {submitting ? 'Menyimpan...' : 'Simpan Pembayaran'}
        </Button>
      </form>
    </Modal>
  );
}

// -----------------------------------------------------
// KOMPONEN: Form Input Kasbon Karyawan
// -----------------------------------------------------
function EmployeeLoanForm({ onSuccess, onClose }) {
  const { month, year } = currentMonthYear();
  const defaultPeriod = `${year}-${String(month).padStart(2, '0')}`;
  
  const { data: employees } = useData(() => api.listEmployees(), []);
  const [form, setForm] = useState({ employeeId: '', amount: '', tenor: '3', startMonth: defaultPeriod });
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const monthlyDeduction = form.amount && form.tenor ? Math.round(Number(form.amount) / Number(form.tenor)) : 0;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createEmployeeLoan(form.employeeId, Number(form.amount), Number(form.tenor), form.startMonth);
      toast?.showToast('Kasbon Karyawan berhasil dicatat. Sistem akan otomatis memotong payroll.');
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
      <div className="bg-warning/10 border border-warning/20 p-3 rounded-card text-xs text-warning mb-2">
        <p className="font-bold mb-1">ℹ️ Sistem Auto-Deduct Payroll</p>
        <p>Kasbon/Piutang ini akan secara otomatis memotong gaji karyawan yang bersangkutan di Tab Payroll setiap bulannya sesuai durasi tenor cicilan.</p>
      </div>
      <Select 
        label="Pilih Karyawan" required value={form.employeeId} onChange={(e) => setForm({...form, employeeId: e.target.value})}
        options={[{value: '', label: '-- Pilih Karyawan --'}, ...(employees || []).map(e => ({ value: e.employee_id, label: `${e.full_name} (${e.position})` }))]}
      />
      <Input label="Total Pinjaman (Rp)" type="number" required min="10000" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Lama Cicilan (Bulan)" type="number" required min="1" max="24" value={form.tenor} onChange={(e) => setForm({...form, tenor: e.target.value})} />
        <Input label="Mulai Dipotong Bulan" type="month" required value={form.startMonth} onChange={(e) => setForm({...form, startMonth: e.target.value})} />
      </div>
      
      {monthlyDeduction > 0 && (
        <div className="bg-surface2 p-3 rounded-card border border-white/[0.05] text-center">
          <p className="text-xs text-textmuted">Karyawan akan dipotong gaji sebesar</p>
          <p className="text-xl font-bold text-danger">-{formatRupiah(monthlyDeduction)} / bulan</p>
        </div>
      )}

      <Button type="submit" full disabled={submitting || !form.employeeId} className="mt-2">
        {submitting ? 'Memproses...' : 'Simpan Piutang Karyawan'}
      </Button>
    </form>
  );
}

// -----------------------------------------------------
// HALAMAN UTAMA
// -----------------------------------------------------
export default function HutangPiutangPage() {
  const { data: records, loading, refetch } = useData(() => api.getAPAR(), []);
  
  // Filter Bulan & Tahun
  const { month, year } = currentMonthYear();
  const [periodFilter, setPeriodFilter] = useState(`${year}-${String(month).padStart(2, '0')}`);
  
  const [tab, setTab] = useState('Payable');
  const [payingRecord, setPayingRecord] = useState(null);
  const [loanModal, setLoanModal] = useState(false);

  // Menyaring data berdasarkan Tipe Tab (Hutang/Piutang) DAN Bulan-Tahun Jatuh Tempo/Dibuat
  const filtered = (records || []).filter((r) => {
    if (r.type !== tab) return false;
    // Logika Filter: Jika ada due_date, filter by due_date. Jika tidak ada, abaikan filter bulan.
    if (!r.due_date) return true; 
    const rDate = new Date(r.due_date);
    const rPeriod = `${rDate.getFullYear()}-${String(rDate.getMonth() + 1).padStart(2, '0')}`;
    return rPeriod === periodFilter;
  });

  const columns = [
    { key: 'counterparty', label: tab === 'Payable' ? 'Hutang Ke (Vendor)' : 'Piutang Dari (Pelanggan/Karyawan)' },
    { key: 'amount', label: 'Total', render: (r) => formatRupiah(r.amount) },
    { key: 'paid_amount', label: 'Terbayar', render: (r) => formatRupiah(r.paid_amount) },
    { key: 'remaining', label: 'Sisa Tagihan', render: (r) => <span className="font-bold text-danger">{formatRupiah(r.remaining)}</span> },
    { key: 'due_date', label: 'Jatuh Tempo', render: (r) => r.due_date ? new Date(r.due_date).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'}) : '-' },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={r.status === 'Paid' ? 'success' : r.status === 'Partial' ? 'warning' : 'neutral'}>{r.status}</Badge> },
    {
      key: 'actions',
      label: '',
      render: (r) => r.status !== 'Paid' && <Button variant="ghost" onClick={() => setPayingRecord(r)}>Bayar / Cicil</Button>,
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">📋 Hutang & Piutang</h1>
          <p className="text-sm text-textmuted">Manajemen Kasbon Karyawan dan Tagihan Vendor</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="month" 
            value={periodFilter} 
            onChange={(e) => setPeriodFilter(e.target.value)} 
            className="bg-surface2 border border-white/[0.08] rounded p-2 text-sm text-white focus:outline-none"
          />
          {tab === 'Receivable' && (
            <Button onClick={() => setLoanModal(true)}>+ Input Piutang Karyawan (Kasbon)</Button>
          )}
        </div>
      </div>

      <Tabs
        tabs={[
          { value: 'Payable', label: 'Daftar Hutang (Payable)' },
          { value: 'Receivable', label: 'Daftar Piutang (Receivable)' },
        ]}
        active={tab}
        onChange={setTab}
      />

      <Card title={`Daftar ${tab === 'Payable' ? 'Hutang' : 'Piutang'} - Periode ${periodFilter}`}>
        {loading ? <p className="text-textmuted text-sm text-center py-8">Memuat sinkronisasi data tagihan...</p> : <Table columns={columns} rows={filtered} emptyMessage={`Tidak ada data ${tab === 'Payable' ? 'hutang' : 'piutang'} di bulan ini.`} />}
      </Card>

      {/* MODAL BAYAR CICILAN EKSTERNAL */}
      <PaymentModal record={payingRecord} onClose={() => setPayingRecord(null)} onSuccess={refetch} />

      {/* MODAL INPUT PIUTANG KARYAWAN */}
      <Modal open={loanModal} onClose={() => setLoanModal(false)} title="Kasbon / Piutang Karyawan">
        <EmployeeLoanForm onSuccess={refetch} onClose={() => setLoanModal(false)} />
      </Modal>

    </div>
  );
}

'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { api } from '@/lib/api';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Tabs from '@/components/ui/Tabs';
import EmployeeForm from '@/components/forms/EmployeeForm';
import BonusConfigForm from '@/components/forms/BonusConfigForm';
import { formatRupiah, currentMonthYear } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

export default function KaryawanPage() {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';
  const isAdmin = user?.role === 'owner' || user?.role === 'admin';
  
  const { data: employees, loading, refetch } = useData(() => api.listEmployees(), []);
  const { data: bonusConfigs, refetch: refetchBonus } = useData(() => (isOwner ? api.listBonusConfigs() : Promise.resolve([])), [isOwner]);
  const [tab, setTab] = useState('list');
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  
  const { month, year } = currentMonthYear();
  // Format periode untuk backend yyyy-MM
  const periodStr = `${year}-${String(month).padStart(2, '0')}`;

  const { data: payroll, loading: payrollLoading, refetch: refetchPayroll } = useData(
    () => (tab === 'payroll' ? api.generatePayroll(month, year) : Promise.resolve(null)),
    [tab, month, year]
  );

  // Data Fetching untuk Tab Penilaian Kinerja
  const { data: performance, loading: performanceLoading } = useData(
    () => (tab === 'performance' ? api.getPerformanceSummary(periodStr) : Promise.resolve(null)),
    [tab, periodStr]
  );

  const toast = useToast();

  const columns = [
    { key: 'full_name', label: 'Nama' },
    { key: 'position', label: 'Jabatan' },
    { key: 'role', label: 'Role', render: (r) => <Badge variant="primary">{r.role}</Badge> },
    { key: 'base_salary', label: 'Gaji Pokok', render: (r) => formatRupiah(r.base_salary) },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={r.status === 'Active' ? 'success' : 'neutral'}>{r.status}</Badge> },
    isOwner && {
      key: 'actions',
      label: '',
      render: (r) => (
        <Button variant="ghost" onClick={() => { setEditing(r); setModal('employee'); }}>
          Edit
        </Button>
      ),
    },
  ].filter(Boolean);

  const payrollColumns = [
    { key: 'employee_name', label: 'Nama' },
    { key: 'total_work_days', label: 'Hari Kerja' },
    { key: 'late_count', label: 'Telat' },
    { key: 'bonus_total', label: 'Bonus', render: (r) => formatRupiah(r.bonus_total) },
    { key: 'deductions', label: 'Potongan', render: (r) => <span className="text-danger">-{formatRupiah(r.deductions || 0)}</span> },
    { key: 'net_salary', label: 'Gaji Bersih', render: (r) => formatRupiah(r.net_salary) },
    { key: 'payment_status', label: 'Status', render: (r) => <Badge variant={r.payment_status === 'Paid' ? 'success' : 'warning'}>{r.payment_status}</Badge> },
    isOwner && {
      key: 'actions',
      label: '',
      render: (r) =>
        r.payment_status === 'Pending' ? (
          <Button
            variant="ghost"
            onClick={async () => {
              await api.markAsPaid(r.payroll_id);
              toast?.showToast('Ditandai sudah dibayar');
              refetchPayroll();
            }}
          >
            Tandai Dibayar
          </Button>
        ) : null,
    },
  ].filter(Boolean);

  const bonusColumns = [
    { key: 'bonus_name', label: 'Nama Bonus' },
    { key: 'type', label: 'Tipe' },
    { key: 'condition_desc', label: 'Syarat' },
    { key: 'amount', label: 'Nominal', render: (r) => formatRupiah(r.amount) },
    { key: 'period', label: 'Periode' },
    { key: 'is_active', label: 'Status', render: (r) => <Badge variant={r.is_active === true || r.is_active === 'TRUE' ? 'success' : 'neutral'}>{r.is_active === true || r.is_active === 'TRUE' ? 'Aktif' : 'Nonaktif'}</Badge> },
  ];

  // Definisi Kolom Penilaian Kinerja
  const performanceColumns = [
    { key: 'employee_name', label: 'Nama Karyawan' },
    { 
      key: 'score', 
      label: 'Skor Kinerja', 
      render: (r) => (
        <span className={`font-bold text-lg ${r.score >= 90 ? 'text-success' : r.score >= 75 ? 'text-warning' : 'text-danger'}`}>
          {r.score} / 100
        </span>
      ) 
    },
    { key: 'late_count', label: 'Telat (-2 Poin)', render: (r) => r.late_count > 0 ? <span className="text-warning font-bold">{r.late_count}x</span> : '-' },
    { key: 'forgot_clock_out_count', label: 'Lupa C/O (-5 Poin)', render: (r) => r.forgot_clock_out_count > 0 ? <span className="text-warning font-bold">{r.forgot_clock_out_count}x</span> : '-' },
    { key: 'alpha_count', label: 'Alpha/Ditolak (-10 Poin)', render: (r) => r.alpha_count > 0 ? <span className="text-danger font-bold">{r.alpha_count}x</span> : '-' },
    { 
      key: 'evaluation', 
      label: 'Predikat', 
      render: (r) => (
        <Badge variant={r.evaluation === 'Excellent' ? 'success' : r.evaluation === 'Good' ? 'warning' : 'danger'}>
          {r.evaluation}
        </Badge>
      ) 
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold">👥 Manajemen Karyawan</h1>
        {isOwner && tab === 'list' && (
          <Button onClick={() => { setEditing(null); setModal('employee'); }}>+ Tambah Karyawan</Button>
        )}
        {isOwner && tab === 'bonus' && (
          <Button onClick={() => setModal('bonus')}>+ Aturan Bonus</Button>
        )}
      </div>

      <Tabs
        tabs={[
          { value: 'list', label: 'Daftar Karyawan' },
          { value: 'performance', label: 'Penilaian Kinerja' },
          { value: 'payroll', label: 'Payroll Bulan Ini' },
          ...(isOwner ? [{ value: 'bonus', label: 'Aturan Bonus' }] : []),
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'list' && (
        <Card>
          {loading ? <p className="text-textmuted text-sm text-center py-8">Memuat...</p> : <Table columns={columns} rows={employees || []} />}
        </Card>
      )}

      {/* Tampilan Tab Penilaian Kinerja */}
      {tab === 'performance' && (
        <Card title={`Rekapitulasi Kinerja Tim - Bulan ${month}/${year}`}>
          {performanceLoading ? (
            <p className="text-textmuted text-sm text-center py-8">Menghitung skor kinerja otomatis...</p>
          ) : (
            <>
              <p className="text-sm text-textmuted mb-4">
                Poin sempurna adalah 100. Sistem otomatis mengurangi poin berdasarkan catatan absensi riil di lapangan.
              </p>
              <Table 
                columns={performanceColumns} 
                rows={(performance || []).filter(r => isAdmin ? true : r.employee_id === user?.employee_id)} 
                emptyMessage="Belum ada data absensi/kinerja di bulan ini"
              />
            </>
          )}
        </Card>
      )}

      {tab === 'payroll' && (
        <Card title={`Payroll ${month}/${year}`}>
          {payrollLoading ? (
            <p className="text-textmuted text-sm text-center py-8">Menghitung payroll...</p>
          ) : (
            <>
              <p className="text-sm text-textmuted mb-4">
                Total payout: <span className="text-text font-bold">{formatRupiah(payroll?.total_payout || 0)}</span> untuk {payroll?.employee_count || 0} karyawan
              </p>
              <Table columns={payrollColumns} rows={payroll?.records || []} />
            </>
          )}
        </Card>
      )}

      {tab === 'bonus' && (
        <Card title="Aturan Bonus Aktif">
          <Table columns={bonusColumns} rows={bonusConfigs || []} emptyMessage="Belum ada aturan bonus" />
        </Card>
      )}

      <Modal open={modal === 'employee'} onClose={() => setModal(null)} title={editing ? 'Edit Karyawan' : 'Tambah Karyawan'}>
        <EmployeeForm employee={editing} onSuccess={refetch} onClose={() => setModal(null)} />
      </Modal>

      <Modal open={modal === 'bonus'} onClose={() => setModal(null)} title="Buat Aturan Bonus">
        <BonusConfigForm onSuccess={refetchBonus} onClose={() => setModal(null)} />
      </Modal>
    </div>
  );
}

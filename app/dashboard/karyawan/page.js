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
import PerformanceReviewForm from '@/components/forms/PerformanceReviewForm';
import { formatRupiah, currentMonthYear, formatTanggalPendek } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

export default function KaryawanPage() {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';
  const isAdmin = user?.role === 'owner' || user?.role === 'admin' || user?.role === 'supervisor';
  
  const { month, year } = currentMonthYear();
  const [period, setPeriod] = useState(`${year}-${String(month).padStart(2, '0')}`);
  
  const [tab, setTab] = useState('list');
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [evaluating, setEvaluating] = useState(null); // State khusus untuk Penilaian
  const toast = useToast();

  const { data: employees, loading, refetch } = useData(() => api.listEmployees(), []);
  
  const { data: payroll, loading: payrollLoading, refetch: refetchPayroll } = useData(
    () => api.generatePayroll(Number(period.split('-')[1]), Number(period.split('-')[0])),
    [period]
  );

  const { data: performance, loading: performanceLoading, refetch: refetchPerf } = useData(
    () => api.getPerformanceSummary(period),
    [period]
  );

  const { data: bonusLog, loading: bonusLoading } = useData(
    () => api.getDailyBonusLog(period),
    [period]
  );

  const filterOwnData = (arr) => {
    if (isOwner) return arr || [];
    return (arr || []).filter(r => r.employee_id === user?.employee_id || r.employee_name?.includes(user?.full_name));
  };

  const columns = [
    { key: 'full_name', label: 'Nama' },
    { key: 'position', label: 'Jabatan' },
    { key: 'role', label: 'Role', render: (r) => <Badge variant="primary">{r.role}</Badge> },
    { key: 'base_salary', label: 'Gaji Pokok', render: (r) => formatRupiah(r.base_salary) },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={r.status === 'Active' ? 'success' : 'neutral'}>{r.status}</Badge> },
    isOwner && {
      key: 'actions', label: '',
      render: (r) => <Button variant="ghost" onClick={() => { setEditing(r); setModal('employee'); }}>Edit</Button>,
    },
  ].filter(Boolean);

  const payrollColumns = [
    { key: 'employee_name', label: 'Nama' },
    { key: 'total_work_days', label: 'Hari Kerja' },
    { key: 'bonus_total', label: 'Bonus Harian', render: (r) => formatRupiah(r.bonus_total) },
    { key: 'deductions', label: 'Potongan', render: (r) => <span className="text-danger" title={r.deduction_notes}>-{formatRupiah(r.deductions || 0)}</span> },
    { key: 'net_salary', label: 'Gaji Bersih', render: (r) => <span className="font-bold">{formatRupiah(r.net_salary)}</span> },
    { key: 'payment_status', label: 'Status', render: (r) => <Badge variant={r.payment_status === 'Paid' ? 'success' : 'warning'}>{r.payment_status}</Badge> },
    isOwner && {
      key: 'actions', label: '',
      render: (r) => r.payment_status === 'Pending' ? (
        <Button variant="ghost" onClick={async () => { await api.markAsPaid(r.payroll_id); toast?.showToast('Ditandai sudah dibayar'); refetchPayroll(); }}>Tandai Dibayar</Button>
      ) : null,
    },
  ].filter(Boolean);

  const performanceColumns = [
    { key: 'employee_name', label: 'Nama Karyawan' },
    { key: 'score', label: 'Skor Kinerja', render: (r) => r.is_reviewed ? (
        <span className={`font-bold text-lg ${r.score >= 90 ? 'text-success' : r.score >= 75 ? 'text-warning' : 'text-danger'}`}>{r.score} / 100</span>
      ) : <span className="text-textmuted italic">Belum Dinilai</span> 
    },
    { key: 'evaluation', label: 'Predikat', render: (r) => <Badge variant={r.evaluation === 'Excellent' ? 'success' : r.evaluation === 'Good' ? 'warning' : 'neutral'}>{r.evaluation}</Badge> },
    isOwner && {
      key: 'actions', label: '',
      render: (r) => (
        <Button onClick={() => { setEvaluating(r); setModal('performance'); }} variant={r.is_reviewed ? 'ghost' : 'primary'} className={r.is_reviewed ? '' : 'px-3 py-1 text-xs'}>
          {r.is_reviewed ? 'Ubah Nilai' : 'Nilai Karyawan'}
        </Button>
      )
    }
  ].filter(Boolean);

  const bonusColumns = [
    { key: 'date', label: 'Tanggal', render: (r) => formatTanggalPendek(r.date) },
    { key: 'total_sales', label: 'Total Penjualan Kasir', render: (r) => <span className="text-success font-bold">{formatRupiah(r.total_sales)}</span> },
    { key: 'eligible_count', label: 'Jml Penerima', render: (r) => `${r.eligible_count} Orang` },
    { key: 'eligible_names', label: 'Karyawan yang Masuk', render: (r) => <span className="text-xs">{r.eligible_names}</span> },
    { key: 'total_bonus', label: 'Total Bonus Dibagikan', render: (r) => formatRupiah(r.total_bonus) },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">👥 Portal Karyawan & HR</h1>
          <p className="text-sm text-textmuted">Penilaian Kinerja, Payroll, dan Bonus Otomatis</p>
        </div>
        <div className="flex items-center gap-3">
          {(tab === 'performance' || tab === 'payroll' || tab === 'bonus') && (
            <input 
              type="month" 
              value={period} 
              onChange={(e) => setPeriod(e.target.value)} 
              className="bg-surface2 border border-border/50 rounded p-2 text-sm focus:outline-none"
            />
          )}
          {isOwner && tab === 'list' && <Button onClick={() => { setEditing(null); setModal('employee'); }}>+ Tambah Karyawan</Button>}
        </div>
      </div>

      <Tabs
        tabs={[
          { value: 'list', label: 'Data Karyawan' },
          { value: 'performance', label: 'Penilaian Kinerja' },
          { value: 'payroll', label: 'Slip Gaji (Payroll)' },
          { value: 'bonus', label: 'Log Bonus Harian' },
        ]}
        active={tab} onChange={setTab}
      />

      {tab === 'list' && (
        <Card>{loading ? <p className="text-center py-8">Memuat...</p> : <Table columns={columns} rows={isAdmin ? employees : filterOwnData(employees)} />}</Card>
      )}

      {tab === 'performance' && (
        <Card title={`Review Kinerja - Periode ${period}`}>
          {performanceLoading ? <p className="text-center py-8">Memuat Data Kinerja...</p> : <Table columns={performanceColumns} rows={filterOwnData(performance)} emptyMessage="Belum ada data karyawan aktif." />}
        </Card>
      )}

      {tab === 'payroll' && (
        <Card title={`Kalkulasi Gaji Otomatis - Periode ${period}`}>
          {payrollLoading ? <p className="text-center py-8">Menghitung payroll (Gaji Pokok + Bonus Harian - Potongan)...</p> : (
            <>
              {isOwner && <p className="text-sm text-textmuted mb-4 border-b border-white/[0.05] pb-4">Total Payout Perusahaan Bulan Ini: <span className="font-bold text-primary text-lg">{formatRupiah(payroll?.total_payout || 0)}</span></p>}
              <Table columns={payrollColumns} rows={filterOwnData(payroll?.records)} />
            </>
          )}
        </Card>
      )}

      {tab === 'bonus' && (
        <Card title={`Distribusi Bonus Target Omzet (>Rp 1,5 Jt) - Periode ${period}`}>
          <p className="text-sm text-textmuted mb-4">Setiap transaksi kasir melewati target harian, sistem otomatis membagikan Rp 15.000 ke setiap karyawan yang masuk (Hadir/Telat) di hari tersebut.</p>
          {bonusLoading ? <p className="text-center py-8">Memuat log bonus...</p> : <Table columns={bonusColumns} rows={bonusLog} emptyMessage="Belum ada hari yang melewati target di bulan ini." />}
        </Card>
      )}

      {/* MODAL EDIT KARYAWAN */}
      <Modal open={modal === 'employee'} onClose={() => setModal(null)} title={editing ? 'Edit Karyawan' : 'Tambah Karyawan'}>
        <EmployeeForm employee={editing} onSuccess={refetch} onClose={() => setModal(null)} />
      </Modal>

      {/* MODAL PENILAIAN KINERJA (SLIDER) */}
      <Modal open={modal === 'performance'} onClose={() => setModal(null)} title={`Evaluasi Kinerja: ${evaluating?.employee_name}`}>
        <PerformanceReviewForm employee={evaluating} period={period} onSuccess={refetchPerf} onClose={() => setModal(null)} />
      </Modal>

    </div>
  );
}

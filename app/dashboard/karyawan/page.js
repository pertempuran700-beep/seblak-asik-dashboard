'use client';
import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { api } from '@/lib/api';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Tabs from '@/components/ui/Tabs';
import { Input, Select } from '@/components/ui/Input';
import EmployeeForm from '@/components/forms/EmployeeForm';
import PerformanceReviewForm from '@/components/forms/PerformanceReviewForm';
import PayslipCard from '@/components/cards/PayslipCard';
import { formatRupiah, currentMonthYear, formatTanggalPendek } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

function ScheduleModal({ date, settings, employees, editData, onClose, onSuccess }) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const dayIndex = new Date(date).getDay();
  const isWeekend = dayIndex === 0 || dayIndex === 5 || dayIndex === 6;

  const defaultIn = isWeekend ? (settings?.shift_weekend_in || '10:00') : (settings?.shift_weekday_in || '09:00');
  const defaultOut = isWeekend ? (settings?.shift_weekend_out || '21:30') : (settings?.shift_weekday_out || '20:30');

  const [form, setForm] = useState({
    schedule_id: editData?.schedule_id || '',
    employeeId: editData?.employee_id || '',
    startTime: editData?.start_time || defaultIn,
    endTime: editData?.end_time || defaultOut,
    notes: editData?.notes || ''
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.saveDailySchedule({
        schedule_id: form.schedule_id,
        employeeId: form.employeeId,
        date: date,
        startTime: form.startTime,
        endTime: form.endTime,
        notes: form.notes
      });
      toast?.showToast(form.schedule_id ? 'Jadwal berhasil diperbarui!' : 'Jadwal berhasil ditambahkan!');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toast?.showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Yakin ingin menghapus jadwal karyawan ini?')) return;
    setDeleting(true);
    try {
      await api.deleteDailySchedule(form.schedule_id);
      toast?.showToast('Jadwal berhasil dihapus!');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toast?.showToast(err.message, 'error');
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-surface2 p-3 rounded-card text-center mb-4 border border-white/[0.05]">
        <p className="text-xs text-textmuted uppercase tracking-widest">{form.schedule_id ? 'Edit Penjadwalan' : 'Penjadwalan Baru'}</p>
        <p className="text-lg font-bold text-white">{new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      <Select
        label="Pilih Karyawan" required value={form.employeeId} onChange={(e) => setForm({...form, employeeId: e.target.value})}
        options={[{value: '', label: '-- Input Karyawan --'}, ...(employees || []).filter(e => e.status === 'Active').map(e => ({ value: e.employee_id, label: e.full_name }))]}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Jam Masuk" type="time" required value={form.startTime} onChange={(e) => setForm({...form, startTime: e.target.value})} />
        <Input label="Jam Keluar" type="time" required value={form.endTime} onChange={(e) => setForm({...form, endTime: e.target.value})} />
      </div>

      <Input label="Catatan (Opsional)" placeholder="Misal: Tukar shift dengan Reno" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />

      <div className="flex gap-2 mt-4">
        {form.schedule_id && (
          <Button type="button" variant="danger" onClick={handleDelete} disabled={deleting || submitting} className="flex-1">
            {deleting ? 'Menghapus...' : '🗑️ Hapus'}
          </Button>
        )}
        <Button type="submit" disabled={submitting || deleting || !form.employeeId} className={form.schedule_id ? 'flex-[2]' : 'w-full'}>
          {submitting ? 'Menyimpan...' : '💾 Simpan Jadwal'}
        </Button>
      </div>
    </form>
  );
}

function PerformanceGauge({ row }) {
  const color = !row.is_reviewed ? 'text-textmuted' : row.score >= 90 ? 'text-success' : row.score >= 75 ? 'text-warning' : 'text-danger';
  const ring = !row.is_reviewed ? 'border-white/[0.1]' : row.score >= 90 ? 'border-success' : row.score >= 75 ? 'border-warning' : 'border-danger';

  return (
    <div className="max-w-sm mx-auto space-y-6">
      <div className={`w-40 h-40 mx-auto rounded-full border-8 ${ring} flex flex-col items-center justify-center bg-surface2`}>
        <p className={`text-4xl font-black ${color}`}>{row.is_reviewed ? row.score : '—'}</p>
        <p className="text-[10px] text-textmuted uppercase tracking-wider">{row.is_reviewed ? '/ 100' : 'Belum Dinilai'}</p>
      </div>
      <div className="text-center">
        <Badge variant={row.evaluation === 'Excellent' ? 'success' : row.evaluation === 'Good' ? 'warning' : 'neutral'}>{row.evaluation}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface2 rounded-card p-4 text-center">
          <p className="text-2xl font-bold text-warning">{row.late_count}</p>
          <p className="text-[10px] text-textmuted uppercase">Kali Telat</p>
        </div>
        <div className="bg-surface2 rounded-card p-4 text-center">
          <p className="text-2xl font-bold text-danger">{row.alpha_count}</p>
          <p className="text-[10px] text-textmuted uppercase">Kali Alpha</p>
        </div>
      </div>
      {row.is_reviewed && row.details && (
        <Card title="Detail Penilaian">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-textmuted">Pelayanan</span><span className="font-bold">{row.details.hospitality}</span></div>
            <div className="flex justify-between"><span className="text-textmuted">Skill Produk</span><span className="font-bold">{row.details.product_knowledge}</span></div>
            <div className="flex justify-between"><span className="text-textmuted">Kebersihan</span><span className="font-bold">{row.details.hygiene}</span></div>
            <div className="flex justify-between"><span className="text-textmuted">Kedisiplinan</span><span className="font-bold">{row.details.discipline}</span></div>
            <div className="flex justify-between"><span className="text-textmuted">Kerjasama Tim</span><span className="font-bold">{row.details.teamwork}</span></div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function KaryawanPage() {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';
  const isAdmin = user?.role === 'owner' || user?.role === 'admin' || user?.role === 'supervisor';

  const { month, year } = currentMonthYear();
  const [period, setPeriod] = useState(`${year}-${String(month).padStart(2, '0')}`);
  const [tab, setTab] = useState(isOwner ? 'list' : 'schedule');

  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [evaluating, setEvaluating] = useState(null);

  const [selectedDate, setSelectedDate] = useState(null);
  const [editData, setEditData] = useState(null);

  const toast = useToast();

  const { data: employees, loading, refetch } = useData(() => api.listEmployees(), []);
  const { data: settings } = useData(() => api.getSystemSettings(), []);

  // 🔥 Owner/Admin: generatePayroll (massal, tabel semua orang). Employee: getPayslip (cuma milik sendiri).
  const { data: payroll, loading: payrollLoading, refetch: refetchPayroll } = useData(
    () => isOwner || user?.role === 'admin'
      ? api.generatePayroll(Number(period.split('-')[1]), Number(period.split('-')[0]))
      : Promise.resolve(null),
    [period, isOwner, user]
  );
  const { data: mySlip, loading: mySlipLoading, refetch: refetchMySlip } = useData(
    () => (!isOwner && user?.role !== 'admin' && user?.employee_id)
      ? api.getPayslip(user.employee_id, Number(period.split('-')[1]), Number(period.split('-')[0]))
      : Promise.resolve(null),
    [period, user]
  );

  const { data: performance, loading: performanceLoading, refetch: refetchPerf } = useData(() => api.getPerformanceSummary(period), [period]);
  const { data: bonusLog, loading: bonusLoading } = useData(() => api.getDailyBonusLog(period), [period]);
  const { data: monthlySchedule, refetch: refetchSchedule } = useData(() => api.getMonthlySchedule(period), [period]);

  const filterOwnData = (arr) => {
    if (isOwner) return arr || [];
    return (arr || []).filter(r => r.employee_id === user?.employee_id || r.employee_name?.includes(user?.full_name));
  };

  const calendarDays = useMemo(() => {
    const [y, m] = period.split('-');
    const firstDay = new Date(y, Number(m) - 1, 1).getDay();
    const daysInMonth = new Date(y, Number(m), 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${y}-${m}-${String(i).padStart(2, '0')}`;
      days.push({ dayNumber: i, dateString: dateStr });
    }
    return days;
  }, [period]);

  const columns = [
    { key: 'full_name', label: 'Nama' },
    { key: 'position', label: 'Jabatan' },
    { key: 'role', label: 'Role', render: (r) => <Badge variant="primary">{r.role}</Badge> },
    { key: 'base_salary', label: 'Gaji Pokok', render: (r) => formatRupiah(r.base_salary) },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={r.status === 'Active' ? 'success' : 'neutral'}>{r.status}</Badge> },
    isOwner && { key: 'actions', label: '', render: (r) => <Button variant="ghost" onClick={() => { setEditing(r); setModal('employee'); }}>Edit</Button> },
  ].filter(Boolean);

  const performanceColumns = [
    { key: 'employee_name', label: 'Nama Karyawan' },
    { key: 'score', label: 'Skor Kinerja', render: (r) => r.is_reviewed ? (
        <span className={`font-bold text-lg ${r.score >= 90 ? 'text-success' : r.score >= 75 ? 'text-warning' : 'text-danger'}`}>{r.score} / 100</span>
      ) : <span className="text-textmuted italic">Belum Dinilai</span>
    },
    { key: 'evaluation', label: 'Predikat', render: (r) => <Badge variant={r.evaluation === 'Excellent' ? 'success' : r.evaluation === 'Good' ? 'warning' : 'neutral'}>{r.evaluation}</Badge> },
    isOwner && { key: 'actions', label: '', render: (r) => (
        <Button onClick={() => { setEvaluating(r); setModal('performance'); }} variant={r.is_reviewed ? 'ghost' : 'primary'} className={r.is_reviewed ? '' : 'px-3 py-1 text-xs'}>
          {r.is_reviewed ? 'Ubah Nilai' : 'Nilai Karyawan'}
        </Button>
      )
    }
  ].filter(Boolean);

  const payrollColumns = [
    { key: 'employee_name', label: 'Nama' },
    { key: 'total_work_days', label: 'Hari Kerja' },
    { key: 'bonus_total', label: 'Bonus Harian', render: (r) => formatRupiah(r.bonus_total) },
    { key: 'deductions', label: 'Potongan', render: (r) => <span className="text-danger" title={r.deduction_notes}>-{formatRupiah(r.deductions || 0)}</span> },
    { key: 'net_salary', label: 'Gaji Bersih', render: (r) => <span className="font-bold">{formatRupiah(r.net_salary)}</span> },
    { key: 'payment_status', label: 'Status', render: (r) => <Badge variant={r.payment_status === 'Paid' ? 'success' : 'warning'}>{r.payment_status}</Badge> },
    isOwner && { key: 'actions', label: '', render: (r) => r.payment_status === 'Pending' ? (
        <Button variant="ghost" onClick={async () => { await api.markAsPaid(r.payroll_id); toast?.showToast('Ditandai sudah dibayar'); refetchPayroll(); }}>Tandai Dibayar</Button>
      ) : null,
    },
  ].filter(Boolean);

  const bonusColumns = [
    { key: 'date', label: 'Tanggal', render: (r) => formatTanggalPendek(r.date) },
    { key: 'total_sales', label: 'Total Penjualan Kasir', render: (r) => <span className="text-success font-bold">{formatRupiah(r.total_sales)}</span> },
    { key: 'eligible_count', label: 'Jml Penerima', render: (r) => `${r.eligible_count} Orang` },
    { key: 'eligible_names', label: 'Karyawan yang Masuk', render: (r) => <span className="text-xs">{r.eligible_names}</span> },
    { key: 'total_bonus', label: 'Total Bonus Dibagikan', render: (r) => formatRupiah(r.total_bonus) },
  ];

  const availableTabs = [
    isOwner && { value: 'list', label: 'Data Karyawan' },
    { value: 'schedule', label: 'Jadwal Karyawan' },
    { value: 'performance', label: 'Penilaian Kinerja' },
    { value: 'payroll', label: 'Slip Gaji (Payroll)' },
    { value: 'bonus', label: 'Log Bonus Harian' },
  ].filter(Boolean);

  const myPerformanceRow = performance ? filterOwnData(performance)[0] : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">👥 Portal Karyawan & HR</h1>
          <p className="text-sm text-textmuted">Penilaian Kinerja, Jadwal, dan Payroll Otomatis</p>
        </div>
        <div className="flex items-center gap-3">
          {(tab === 'performance' || tab === 'payroll' || tab === 'bonus' || tab === 'schedule') && (
            <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="bg-surface2 border border-border/50 rounded p-2 text-sm focus:outline-none" />
          )}
          {isOwner && tab === 'list' && <Button onClick={() => { setEditing(null); setModal('employee'); }}>+ Tambah Karyawan</Button>}
        </div>
      </div>

      <Tabs tabs={availableTabs} active={tab} onChange={setTab} />

      {tab === 'list' && isOwner && (
        <Card>{loading ? <p className="text-center py-8">Memuat...</p> : <Table columns={columns} rows={employees} />}</Card>
      )}

      {tab === 'schedule' && (
        <Card title={`Kalender Rotasi Kerja — Periode ${period}`}>
          <div className="grid grid-cols-7 gap-1 md:gap-2 text-center text-xs md:text-sm font-bold text-textmuted mb-2">
            <div>Min</div><div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div>
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="bg-transparent border border-transparent rounded p-2 h-24"></div>;

              const daySchedules = (monthlySchedule || []).filter(s => {
                 const dbDate = s.date.split('/');
                 return `${dbDate[2]}-${dbDate[1]}-${dbDate[0]}` === day.dateString;
              });

              return (
                <div
                  key={day.dateString}
                  onClick={() => { if(isAdmin) { setSelectedDate(day.dateString); setEditData(null); setModal('schedule'); } }}
                  className={`bg-surface2 border ${isAdmin ? 'cursor-pointer hover:border-primary/50' : ''} border-white/[0.05] rounded p-1 md:p-2 h-24 md:h-32 overflow-y-auto flex flex-col hide-scrollbar transition-colors`}
                >
                  <div className="text-right text-xs md:text-sm font-bold text-white mb-1 opacity-70">{day.dayNumber}</div>
                  <div className="space-y-1 flex-1">
                    {daySchedules.map((s, i) => (
                      <div
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation();
                          if(isAdmin) { setSelectedDate(day.dateString); setEditData(s); setModal('schedule'); }
                        }}
                        className="bg-primary/20 hover:bg-primary/40 text-primary border border-primary/30 text-[9px] md:text-xs rounded px-1 py-0.5 md:py-1 truncate cursor-pointer transition-colors"
                      >
                        <span className="font-bold">{s.Name.split(' ')[0]}</span> <span className="opacity-80">({s.start_time}-{s.end_time})</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {tab === 'performance' && (
        isOwner ? (
          <Card title={`Review Kinerja - Periode ${period}`}>
            {performanceLoading ? <p className="text-center py-8">Memuat Data Kinerja...</p> : <Table columns={performanceColumns} rows={performance} emptyMessage="Belum ada data karyawan aktif." />}
          </Card>
        ) : (
          performanceLoading ? <p className="text-center py-8">Memuat penilaian Anda...</p> :
          myPerformanceRow ? <PerformanceGauge row={myPerformanceRow} /> :
          <p className="text-center py-8 text-textmuted">Data penilaian belum tersedia.</p>
        )
      )}

      {tab === 'payroll' && (
        isOwner || user?.role === 'admin' ? (
          <Card title={`Kalkulasi Gaji Otomatis - Periode ${period}`}>
            {payrollLoading ? <p className="text-center py-8">Menghitung payroll (Gaji Pokok + Bonus Harian - Potongan)...</p> : (
              <>
                {isOwner && <p className="text-sm text-textmuted mb-4 border-b border-white/[0.05] pb-4">Total Payout Perusahaan Bulan Ini: <span className="font-bold text-primary text-lg">{formatRupiah(payroll?.total_payout || 0)}</span></p>}
                <Table columns={payrollColumns} rows={payroll?.records} />
              </>
            )}
          </Card>
        ) : (
          mySlipLoading ? <p className="text-center py-8">Memuat slip gaji Anda...</p> :
          mySlip ? <PayslipCard slip={mySlip} /> :
          <p className="text-center py-8 text-textmuted">Slip gaji belum tersedia untuk periode ini.</p>
        )
      )}

      {tab === 'bonus' && (
        <Card title={`Distribusi Bonus Target Omzet (>Rp 1,5 Jt) - Periode ${period}`}>
          {bonusLoading ? <p className="text-center py-8">Memuat log bonus...</p> : <Table columns={bonusColumns} rows={bonusLog} emptyMessage="Belum ada hari yang melewati target di bulan ini." />}
        </Card>
      )}

      <Modal open={modal === 'employee'} onClose={() => setModal(null)} title={editing ? 'Edit Karyawan' : 'Tambah Karyawan'}>
        <EmployeeForm employee={editing} onSuccess={refetch} onClose={() => setModal(null)} />
      </Modal>
      <Modal open={modal === 'performance'} onClose={() => setModal(null)} title={`Evaluasi Kinerja: ${evaluating?.employee_name}`}>
        <PerformanceReviewForm employee={evaluating} period={period} onSuccess={refetchPerf} onClose={() => setModal(null)} />
      </Modal>

      <Modal open={modal === 'schedule'} onClose={() => setModal(null)} title="Manajemen Jadwal Harian">
        <ScheduleModal
          date={selectedDate}
          settings={settings}
          employees={employees}
          editData={editData}
          onSuccess={refetchSchedule}
          onClose={() => setModal(null)}
        />
      </Modal>
    </div>
  );
}

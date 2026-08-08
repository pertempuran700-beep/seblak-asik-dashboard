'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { api } from '@/lib/api';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import AttendanceForm from '@/components/forms/AttendanceForm';
import { monthPeriodString, formatTanggalPendek } from '@/lib/utils';

export default function AbsensiPage() {
  const { user } = useAuth();
  const period = monthPeriodString();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (user && (user.role === 'owner' || user.role === 'admin' || user.role === 'supervisor')) {
      const todayIso = new Date().toISOString().split('T')[0];
      setStartDate(todayIso);
      setEndDate(todayIso);
    }
  }, [user]);

  const { data: summary, refetch } = useData(
    () => (user ? api.getAttendanceSummary(user.role === 'owner' || user.role === 'admin' || user.role === 'supervisor' ? null : user.employee_id, period) : Promise.resolve(null)),
    [user, period]
  );

  const today = new Date();
  const todayRecord = summary?.records?.find(r => {
    if (r.employee_id !== user?.employee_id) return false;
    const d = new Date(r.date);
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });

  const filteredRecords = (summary?.records || []).filter(r => {
    if (!startDate && !endDate) return true;
    const rDateObj = new Date(r.date);
    const rDate = `${rDateObj.getFullYear()}-${String(rDateObj.getMonth() + 1).padStart(2, '0')}-${String(rDateObj.getDate()).padStart(2, '0')}`;
    if (startDate && rDate < startDate) return false;
    if (endDate && rDate > endDate) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold">✅ Absensi Karyawan</h1>
        <p className="text-sm text-textmuted">Sistem presensi terintegrasi GPS & Geofence</p>
      </div>

      <Card>
        <AttendanceForm employeeId={user?.employee_id} employeeName={user?.full_name} todayRecord={todayRecord} onSuccess={refetch} />
      </Card>

      <Card title="Riwayat Kehadiran & Izin Tim">
        {summary ? (
          <>
            <div className="grid grid-cols-4 gap-2 mb-4 text-center bg-surface2 p-4 rounded-card border border-white/[0.05]">
              <div><p className="text-2xl font-bold text-success">{summary.hadir}</p><p className="text-xs text-textmuted uppercase tracking-wider">Hadir</p></div>
              <div><p className="text-2xl font-bold text-warning">{summary.telat}</p><p className="text-xs text-textmuted uppercase tracking-wider">Telat</p></div>
              <div><p className="text-2xl font-bold text-textmuted">{summary.izin}</p><p className="text-xs text-textmuted uppercase tracking-wider">Izin</p></div>
              <div><p className="text-2xl font-bold text-danger">{summary.alpha}</p><p className="text-xs text-textmuted uppercase tracking-wider">Alpha/Ditolak</p></div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 bg-surface2 p-3 rounded-card border border-white/[0.05]">
              <Input label="Dari Tanggal" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-black text-black" />
              <Input label="Sampai Tanggal" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-black text-black" />
            </div>

            <Table
              columns={[
                { key: 'date', label: 'Tanggal', render: (r) => formatTanggalPendek(r.date) },
                { key: 'employee_name', label: 'Karyawan', render: (r) => <span className="font-bold">{r.employee_name || r.employee_id}</span> },
                { key: 'clock_in', label: 'Jam Masuk', render: (r) => r.clock_in ? new Date(r.clock_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-' },
                { key: 'clock_out', label: 'Jam Keluar', render: (r) => r.clock_out ? new Date(r.clock_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-' },
                {
                  key: 'status', label: 'Status',
                  render: (r) => {
                    const isRejected = r.approval_status === 'Rejected';
                    const isLate = r.late_minutes && r.late_minutes !== '00:00';
                    const displayStatus = isRejected ? 'Absent' : (isLate ? 'Late' : r.status);
                    const color = displayStatus === 'Absent' ? 'text-danger font-semibold' : displayStatus === 'Late' ? 'text-warning font-semibold' : 'text-success';
                    return <span className={color}>{displayStatus}</span>;
                  },
                },
                {
                  key: 'outside_reason', label: 'Catatan Persetujuan',
                  render: (r) => {
                     // Merapikan tampilan agar cukup menunjukkan nama penyetuju
                     if (r.approved_by && r.approved_by !== 'auto') return <span className="text-xs text-info font-medium">Disetujui oleh: {r.approved_by}</span>;
                     if (r.approval_status === 'auto') return <span className="text-xs text-success">Sistem (Dalam Radius)</span>;
                     if (r.outside_reason) return <span className="text-xs opacity-70">{r.outside_reason}</span>;
                     return '-';
                  }
                }
              ]}
              rows={filteredRecords}
            />
          </>
        ) : (
          <p className="text-textmuted text-sm text-center py-6">Memuat riwayat...</p>
        )}
      </Card>
    </div>
  );
}

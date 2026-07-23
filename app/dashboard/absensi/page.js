'use client';
import { useState } from 'react';
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

  // Jika owner/admin ingin melihat semua riwayat, bisa ditarik tanpa employeeId atau spesifik
  const { data: summary, refetch } = useData(
    () => (user ? api.getAttendanceSummary(user.role === 'owner' || user.role === 'admin' ? null : user.employee_id, period) : Promise.resolve(null)),
    [user, period]
  );

  const filteredRecords = (summary?.records || []).filter(r => {
    if (!startDate && !endDate) return true;
    const rDate = new Date(r.date).toISOString().slice(0, 10);
    if (startDate && rDate < startDate) return false;
    if (endDate && rDate > endDate) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold">✅ Absensi Karyawan</h1>
      </div>

      <Card>
        <AttendanceForm employeeId={user?.employee_id} employeeName={user?.full_name} onSuccess={refetch} />
      </Card>

      <Card title="Riwayat Kehadiran & Izin Tim">
        {summary ? (
          <>
            <div className="grid grid-cols-4 gap-2 mb-4 text-center">
              <div>
                <p className="text-lg font-bold text-success">{summary.hadir}</p>
                <p className="text-xs text-textmuted">Hadir</p>
              </div>
              <div>
                <p className="text-lg font-bold text-warning">{summary.telat}</p>
                <p className="text-xs text-textmuted">Telat</p>
              </div>
              <div>
                <p className="text-lg font-bold text-textmuted">{summary.izin}</p>
                <p className="text-xs text-textmuted">Izin</p>
              </div>
              <div>
                <p className="text-lg font-bold text-danger">{summary.alpha}</p>
                <p className="text-xs text-textmuted">Alpha / Ditolak</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 bg-surface2 p-3 rounded-card">
              <Input label="Dari Tanggal" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <Input label="Sampai Tanggal" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>

            <Table
              columns={[
                { key: 'date', label: 'Tanggal', render: (r) => formatTanggalPendek(r.date) },
                { key: 'employee_name', label: 'Nama Karyawan', render: (r) => r.employee_name || r.employee_id },
                { 
                  key: 'clock_in', 
                  label: 'Jam Masuk', 
                  render: (r) => {
                    if (!r.clock_in) return '-';
                    const d = new Date(r.clock_in);
                    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Jakarta' });
                  } 
                },
                {
                  key: 'status',
                  label: 'Status',
                  render: (r) => {
                    const isRejected = r.approval_status === 'Rejected';
                    const displayStatus = isRejected ? 'Absent' : (r.late_minutes > 0 ? 'Late' : r.status);
                    const colorClass = displayStatus === 'Absent' ? 'text-danger font-semibold' : displayStatus === 'Late' ? 'text-warning font-semibold' : 'text-success';
                    return <span className={colorClass}>{displayStatus}</span>;
                  },
                },
                {
                  key: 'approval_status',
                  label: 'Approval',
                  render: (r) => {
                    const statusText = r.approval_status === 'auto' ? 'Approved' : (r.approval_status || 'Pending');
                    return <span className="text-textmuted capitalize">{statusText}</span>;
                  },
                },
                {
                  key: 'outside_reason',
                  label: 'Alasan / Keterangan',
                  render: (r) => r.outside_reason || r.notes || '-'
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

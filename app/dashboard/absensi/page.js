'use client';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { api } from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import AttendanceForm from '@/components/forms/AttendanceForm';
import { monthPeriodString, formatTanggalPendek } from '@/lib/utils';

export default function AbsensiPage() {
  const { user } = useAuth();
  const period = monthPeriodString();
  const isAdmin = user?.role === 'owner' || user?.role === 'admin';

  const { data: summary, refetch } = useData(
    () => (user ? api.getAttendanceSummary(user.employee_id, period) : Promise.resolve(null)),
    [user, period]
  );

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-xl font-bold">✅ Absensi</h1>
        <p className="text-textmuted text-sm">Radius kantor: 100 meter</p>
      </div>

      <Card>
        <AttendanceForm employeeId={user?.employee_id} onSuccess={refetch} />
      </Card>

      <Card title="Riwayat Bulan Ini">
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
                <p className="text-xs text-textmuted">Alpha</p>
              </div>
            </div>

            <Table
              columns={[
                { key: 'date', label: 'Tanggal', render: (r) => formatTanggalPendek(r.date) },
                { key: 'clock_in', label: 'Masuk', render: (r) => (r.clock_in ? formatTanggalPendek(r.clock_in) : '-') },
                {
                  key: 'status',
                  label: 'Status',
                  render: (r) => (
                    <Badge variant={r.status === 'Present' ? 'success' : r.status === 'Late' ? 'warning' : 'neutral'}>
                      {r.status}
                    </Badge>
                  ),
                },
                {
                  key: 'approval_status',
                  label: 'Approval',
                  render: (r) =>
                    r.approval_status === 'Pending' ? (
                      <Badge variant="warning">Pending</Badge>
                    ) : r.approval_status === 'Approved' || r.approval_status === 'auto' ? (
                      <Badge variant="success">OK</Badge>
                    ) : (
                      '-'
                    ),
                },
              ]}
              rows={summary.records || []}
            />
          </>
        ) : (
          <p className="text-textmuted text-sm text-center py-6">Memuat riwayat...</p>
        )}
      </Card>
    </div>
  );
}

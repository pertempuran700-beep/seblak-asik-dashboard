'use client';
import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useToast } from '@/components/ui/Toast';
import { formatJam } from '@/lib/utils';

const OFFICE_LAT = -7.046278;
const OFFICE_LNG = 107.765472;
const RADIUS_M = 100;

export default function AttendanceForm({ employeeId, onSuccess }) {
  const { position, distance, withinRange, error, loading, locate } = useGeolocation(OFFICE_LAT, OFFICE_LNG, RADIUS_M);
  const [submitting, setSubmitting] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  
  // State untuk Modal Alasan Telat/Luar Jangkauan
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reasonText, setReasonText] = useState('');
  
  // State untuk Modal Izin/Tukar Hari
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [leaveForm, setLeaveForm] = useState({ date: '', reason: '', substituteId: '', compensationType: 'Lembur' });
  
  const toast = useToast();

  useEffect(() => {
    if (showLeaveModal && employees.length === 0) {
      api.listEmployees().then(setEmployees).catch(console.error);
    }
  }, [showLeaveModal]);

  async function handleClockIn(isFromModal = false) {
    if (!isFromModal && (!withinRange || error)) {
      setShowReasonModal(true);
      return;
    }

    setSubmitting(true);
    try {
      const pos = position || (await locate());
      const result = await api.clockIn(employeeId, pos.lat, pos.lng, reasonText);
      setLastAction(result);
      toast?.showToast(
        result.within_range
          ? 'Clock in berhasil (' + result.status + ')'
          : 'Clock in tercatat, menunggu approval supervisor'
      );
      setShowReasonModal(false);
      setReasonText('');
      onSuccess?.();
    } catch (err) {
      toast?.showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClockOut() {
    setSubmitting(true);
    try {
      const pos = position || (await locate());
      await api.clockOut(employeeId, pos.lat, pos.lng);
      toast?.showToast('Clock out berhasil, sampai jumpa!');
      onSuccess?.();
    } catch (err) {
      toast?.showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRequestLeave(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.requestLeave(employeeId, leaveForm.date, leaveForm.reason, leaveForm.substituteId, leaveForm.compensationType);
      toast?.showToast(res.message);
      setShowLeaveModal(false);
    } catch (err) {
      toast?.showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-surface2 rounded-card p-4 text-center">
        {distance !== null ? (
          <>
            <p className="text-3xl mb-1">{withinRange ? '📍✅' : '📍⚠️'}</p>
            <p className="text-sm text-textmuted">Jarak dari kantor</p>
            <p className="text-xl font-bold">{distance} m</p>
            <Badge variant={withinRange ? 'success' : 'warning'}>
              {withinRange ? 'Dalam radius' : 'Di luar radius ' + RADIUS_M + 'm'}
            </Badge>
          </>
        ) : (
          <>
            <p className="text-3xl mb-2">🗺️</p>
            <Button variant="secondary" onClick={locate} disabled={loading}>
              {loading ? 'Mencari lokasi...' : 'Aktifkan Lokasi'}
            </Button>
          </>
        )}
        {error && <p className="text-danger text-xs mt-2">{error}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button onClick={() => handleClockIn(false)} disabled={submitting} className="py-4">
          ⏰ Clock In
        </Button>
        <Button variant="secondary" onClick={handleClockOut} disabled={submitting} className="py-4">
          🏁 Clock Out
        </Button>
      </div>

      <Button variant="secondary" full onClick={() => setShowLeaveModal(true)} className="mt-2 border border-dashed">
        🏖️ Izin Tidak Masuk / Tukar Hari
      </Button>

      {lastAction && (
        <p className="text-xs text-textmuted text-center mt-2">
          Tercatat {formatJam(new Date())} — status: {lastAction.status}
        </p>
      )}

      {/* Modal Alasan Luar Jangkauan */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-card p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-2">Peringatan Absensi</h3>
            <p className="text-sm text-textmuted mb-4">Anda terdeteksi di luar radius kantor atau terlambat. Harap masukkan alasan absensi Anda hari ini.</p>
            <Input label="Alasan" required value={reasonText} onChange={(e) => setReasonText(e.target.value)} />
            <div className="flex gap-2 mt-4">
              <Button variant="secondary" full onClick={() => setShowReasonModal(false)}>Batal</Button>
              <Button full onClick={() => handleClockIn(true)} disabled={!reasonText || submitting}>Kirim Absen</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pengajuan Izin */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-card p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Pengajuan Izin Kerja</h3>
            <form onSubmit={handleRequestLeave} className="space-y-3">
              <Input label="Tanggal Izin" type="date" required value={leaveForm.date} onChange={(e) => setLeaveForm({...leaveForm, date: e.target.value})} />
              <Input label="Alasan Izin" required value={leaveForm.reason} onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})} />
              <Select 
                label="Karyawan Pengganti" 
                required 
                value={leaveForm.substituteId} 
                onChange={(e) => setLeaveForm({...leaveForm, substituteId: e.target.value})}
                options={[ {value: '', label: 'Pilih Pengganti...'}, ...employees.filter(e => e.employee_id !== employeeId).map(e => ({ value: e.employee_id, label: e.full_name })) ]}
              />
              <Select 
                label="Kompensasi Pengganti" 
                required 
                value={leaveForm.compensationType} 
                onChange={(e) => setLeaveForm({...leaveForm, compensationType: e.target.value})}
                options={[ {value: 'Lembur', label: 'Lembur (Potong Gaji Anda Rp 50.000)'}, {value: 'Tukar Hari', label: 'Tukar Hari Kerja (Maks 3x Sebulan)'} ]}
              />
              <div className="flex gap-2 mt-4">
                <Button variant="secondary" type="button" full onClick={() => setShowLeaveModal(false)}>Batal</Button>
                <Button full type="submit" disabled={submitting}>Kirim Request</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

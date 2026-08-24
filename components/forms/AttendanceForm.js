'use client';
import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useToast } from '@/components/ui/Toast';
import { formatJam } from '@/lib/utils';

const OFFICE_LAT = -7.0463518;
const OFFICE_LNG = 107.7598885;
const RADIUS_M = 100;

export default function AttendanceForm({ employeeId, employeeName, todayRecord, onSuccess }) {
  const { position, distance, withinRange, error, loading, locate } = useGeolocation(OFFICE_LAT, OFFICE_LNG, RADIUS_M);
  const [submitting, setSubmitting] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reasonText, setReasonText] = useState('');
  
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [leaveForm, setLeaveForm] = useState({ date: '', reason: '', substituteId: '', compensationType: 'Lembur', swapDate: '' });
  
  const [dayOffDates, setDayOffDates] = useState([]);
  const [loadingDayOff, setLoadingDayOff] = useState(false);
  
  const toast = useToast();

  useEffect(() => {
    if (showLeaveModal && employees.length === 0) {
      api.listEmployees().then(setEmployees).catch(console.error);
    }
  }, [showLeaveModal]);

  // 🔥 Begitu user pilih "Tukar Hari", tarik daftar tanggal libur terjadwal milik si karyawan
  useEffect(() => {
    if (leaveForm.compensationType === 'Tukar Hari' && employeeId) {
      setLoadingDayOff(true);
      api.getEmployeeDayOffDates(employeeId)
        .then((dates) => setDayOffDates(dates || []))
        .catch(() => setDayOffDates([]))
        .finally(() => setLoadingDayOff(false));
    } else {
      setDayOffDates([]);
      setLeaveForm((prev) => ({ ...prev, swapDate: '' }));
    }
  }, [leaveForm.compensationType, employeeId]);

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
      // 🔥 Kalau server minta alasan (telat, meski dalam radius) → buka modal, bukan cuma tampilkan error
      if (!isFromModal && err.message.includes('alasan')) {
        setShowReasonModal(true);
      } else {
        toast?.showToast(err.message, 'error');
      }
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
    if (leaveForm.compensationType === 'Tukar Hari' && !leaveForm.swapDate) {
      toast?.showToast('Pilih tanggal tukar terlebih dahulu', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.requestLeave(
        employeeId, leaveForm.date, leaveForm.reason, leaveForm.substituteId,
        leaveForm.compensationType, leaveForm.compensationType === 'Tukar Hari' ? leaveForm.swapDate : null
      );
      toast?.showToast(res.message);
      setShowLeaveModal(false);
      setLeaveForm({ date: '', reason: '', substituteId: '', compensationType: 'Lembur', swapDate: '' });
    } catch (err) {
      toast?.showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const selectedSubstitute = employees.find((e) => e.employee_id === leaveForm.substituteId);

  return (
    <div className="space-y-4">
      {/* Tampilan Nama Karyawan Aktif */}
      <div className="text-center bg-surface2 py-2 rounded-card">
        <p className="text-xs text-textmuted uppercase tracking-wider">Karyawan Aktif</p>
        <p className="text-lg font-bold">{employeeName || employeeId}</p>
      </div>

      <div className="bg-surface2 rounded-card p-4 text-center">
        {distance !== null ? (
          <>
            <p className="text-3xl mb-1">{withinRange ? '📍✅' : '📍⚠️'}</p>
            <p className="text-sm text-textmuted">Jarak dari kantor</p>
            <p className="text-xl font-bold">{distance} m</p>
            <Badge variant={withinRange ? 'success' : 'warning'}>
              {withinRange ? 'Dalam radius' : 'Di luar radius'}
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
        <Button onClick={() => handleClockIn(false)} disabled={submitting || (todayRecord && !todayRecord.clock_out)} className="py-4">
          ⏰ Clock In
        </Button>
        <Button variant="secondary" onClick={handleClockOut} disabled={submitting || !todayRecord || todayRecord.clock_out} className="py-4">
          🏁 Clock Out
        </Button>
      </div>

      {todayRecord && !todayRecord.clock_out && (
        <div className={`mt-2 p-4 rounded-card border text-center animate-pulse ${
          todayRecord.late_minutes && todayRecord.late_minutes !== '00:00' 
            ? 'bg-danger/10 border-danger text-danger' 
            : 'bg-success/10 border-success text-success'
        }`}>
          <p className="font-bold mb-1 text-lg">
            {todayRecord.late_minutes && todayRecord.late_minutes !== '00:00' 
              ? '⚠️ STATUS: TERLAMBAT MASUK' 
              : '✅ STATUS: SEDANG BEKERJA'}
          </p>
          {todayRecord.late_minutes && todayRecord.late_minutes !== '00:00' && (
            <p className="text-sm font-bold mb-2">
              Durasi Keterlambatan: {todayRecord.late_minutes} Jam
            </p>
          )}
          <p className="text-xs opacity-80 mt-1">
            Status ini akan terus muncul hingga Anda menekan tombol <br/> 
            <b>Clock Out</b> atau sistem mereset pada 23:59 malam.
          </p>
        </div>
      )}

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
              <Input label="Tanggal Izin (Anda tidak masuk)" type="date" required value={leaveForm.date} onChange={(e) => setLeaveForm({...leaveForm, date: e.target.value})} />
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
                onChange={(e) => setLeaveForm({...leaveForm, compensationType: e.target.value, swapDate: ''})}
                options={[ {value: 'Lembur', label: 'Lembur (Potong Gaji Anda Rp 50.000)'}, {value: 'Tukar Hari', label: 'Tukar Hari Kerja (Maks 3x Sebulan)'} ]}
              />

              {/* 🔥 BAGIAN BARU: Dropdown Tanggal Tukar (hanya muncul jika Tukar Hari) */}
              {leaveForm.compensationType === 'Tukar Hari' && (
                <div className="bg-surface2 p-3 rounded-card border border-primary/20 space-y-2">
                  <p className="text-xs text-textmuted">
                    Anda akan masuk menggantikan hari libur Anda sendiri di tanggal berikut{selectedSubstitute ? ` (menggantikan posisi ${selectedSubstitute.full_name} yang izin)` : ''}:
                  </p>
                  {loadingDayOff ? (
                    <p className="text-xs text-textmuted italic">Memuat jadwal libur Anda...</p>
                  ) : dayOffDates.length === 0 ? (
                    <p className="text-xs text-danger">
                      ⚠️ Tidak ditemukan jadwal libur terdaftar untuk Anda dalam 45 hari ke depan. Hubungi Owner untuk memastikan jadwal Anda sudah diinput.
                    </p>
                  ) : (
                    <Select
                      label="Tanggal Tukar (Hari Libur Anda)"
                      required
                      value={leaveForm.swapDate}
                      onChange={(e) => setLeaveForm({...leaveForm, swapDate: e.target.value})}
                      options={[
                        { value: '', label: 'Pilih tanggal libur Anda...' },
                        ...dayOffDates.map((d) => ({ value: d.date, label: d.label }))
                      ]}
                    />
                  )}
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <Button variant="secondary" type="button" full onClick={() => setShowLeaveModal(false)}>Batal</Button>
                <Button full type="submit" disabled={submitting || (leaveForm.compensationType === 'Tukar Hari' && dayOffDates.length === 0)}>
                  Kirim Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

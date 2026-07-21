'use client';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
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
  const toast = useToast();

  async function handleClockIn() {
    setSubmitting(true);
    try {
      const pos = position || (await locate());
      const result = await api.clockIn(employeeId, pos.lat, pos.lng);
      setLastAction(result);
      toast?.showToast(
        result.within_range
          ? 'Clock in berhasil (' + result.status + ')'
          : 'Clock in tercatat, menunggu approval supervisor (di luar radius)'
      );
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
        <Button onClick={handleClockIn} disabled={submitting} className="py-4">
          ⏰ Clock In
        </Button>
        <Button variant="secondary" onClick={handleClockOut} disabled={submitting} className="py-4">
          🏁 Clock Out
        </Button>
      </div>

      {lastAction && (
        <p className="text-xs text-textmuted text-center">
          Tercatat {formatJam(new Date())} — status: {lastAction.status}
        </p>
      )}
    </div>
  );
}

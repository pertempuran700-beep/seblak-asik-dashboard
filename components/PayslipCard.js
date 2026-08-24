'use client';
import Card from '@/components/ui/Card';
import { formatRupiah } from '@/lib/utils';

export default function PayslipCard({ slip }) {
  if (!slip) return null;

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-primary/20 to-surface2 rounded-card p-6 border border-primary/30 text-center">
        <p className="text-xs text-textmuted uppercase tracking-widest mb-1">Slip Gaji — {slip.period}</p>
        <p className="text-lg font-bold mb-1">{slip.employee_name}</p>
        <p className="text-xs text-textmuted mb-4">{slip.position}</p>
        <p className="text-4xl font-black text-success">{formatRupiah(slip.net_salary)}</p>
        <p className="text-xs text-textmuted mt-1">Take Home Pay</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface2 rounded-card p-3 text-center">
          <p className="text-xl font-bold text-success">{slip.total_work_days}</p>
          <p className="text-[10px] text-textmuted uppercase">Hari Kerja</p>
        </div>
        <div className="bg-surface2 rounded-card p-3 text-center">
          <p className="text-xl font-bold text-warning">{slip.late_count}</p>
          <p className="text-[10px] text-textmuted uppercase">Telat</p>
        </div>
        <div className="bg-surface2 rounded-card p-3 text-center">
          <p className="text-xl font-bold text-danger">{slip.alpha_count}</p>
          <p className="text-[10px] text-textmuted uppercase">Alpha</p>
        </div>
      </div>

      <Card title="💰 Rincian Perhitungan">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-textmuted">Gaji Pokok</span><span className="font-medium">{formatRupiah(slip.base_salary)}</span></div>
          <div className="flex justify-between text-success">
            <span className="text-textmuted">Bonus Harian ({slip.bonus_days.length}x hari target tercapai)</span>
            <span className="font-medium">+{formatRupiah(slip.bonus_total)}</span>
          </div>
          {slip.supervisor_bonus > 0 && (
            <div className="flex justify-between text-success">
              <span className="text-textmuted">Bonus Supervisor</span>
              <span className="font-medium">+{formatRupiah(slip.supervisor_bonus)}</span>
            </div>
          )}
          {slip.alpha_count > 0 && (
            <div className="flex justify-between text-danger">
              <span className="text-textmuted">Potongan Alpha ({slip.alpha_count}x)</span>
              <span className="font-medium">-{formatRupiah(slip.alpha_count * 50000)}</span>
            </div>
          )}
          {slip.loan_deduction > 0 && (
            <div className="flex justify-between text-danger">
              <span className="text-textmuted">Cicilan Piutang/Kasbon</span>
              <span className="font-medium">-{formatRupiah(slip.loan_deduction)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-white/[0.1] pt-2 font-bold text-success">
            <span>Total Diterima</span>
            <span>{formatRupiah(slip.net_salary)}</span>
          </div>
        </div>
      </Card>

      {slip.izin_count > 0 || slip.sakit_count > 0 ? (
        <div className="bg-surface2 rounded-card p-3 text-xs text-textmuted flex gap-4 justify-center">
          {slip.izin_count > 0 && <span>🏖️ Izin: {slip.izin_count}x</span>}
          {slip.sakit_count > 0 && <span>🤒 Sakit: {slip.sakit_count}x</span>}
        </div>
      ) : null}
    </div>
  );
}

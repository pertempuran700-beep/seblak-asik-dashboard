export function formatRupiah(num) {
  if (num === null || num === undefined || isNaN(num)) return 'Rp 0';
  return 'Rp ' + Math.round(num).toLocaleString('id-ID');
}

export function formatCompactRupiah(num) {
  if (num === null || num === undefined || isNaN(num)) return 'Rp 0';
  const abs = Math.abs(num);
  if (abs >= 1_000_000_000) return 'Rp ' + (num / 1_000_000_000).toFixed(1) + 'M';
  if (abs >= 1_000_000) return 'Rp ' + (num / 1_000_000).toFixed(1) + 'Jt';
  if (abs >= 1_000) return 'Rp ' + (num / 1_000).toFixed(0) + 'Rb';
  return formatRupiah(num);
}

export function formatTanggalIndonesia(date) {
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatTanggalPendek(date) {
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

export function formatJam(date) {
  const d = new Date(date);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
}

export function currentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function monthPeriodString(date = new Date()) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
}

export function pctChangeLabel(pct) {
  if (pct === 0) return '= 0%';
  const arrow = pct > 0 ? '▲' : '▼';
  return arrow + ' ' + (pct > 0 ? '+' : '') + pct.toFixed(1) + '%';
}

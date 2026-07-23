'use client';
import Card from '@/components/ui/Card';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">⚙️ Pengaturan</h1>

      <Card title="Konfigurasi Bisnis">
        <p className="text-sm text-textmuted mb-4">
          Pengaturan inti (lokasi kantor, radius absensi, biaya admin, jam kerja, persentase profit sharing,
          token Telegram bot) dikelola langsung di tab <span className="text-text font-medium">⚙️ Settings</span> pada
          Google Sheets — ini menjaga satu sumber kebenaran (single source of truth) yang juga dipakai backend
          Apps Script secara langsung.
        </p>
        <a
          href="https://sheets.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-primary text-white text-sm font-bold rounded-button px-4 py-2.5 hover:shadow-glow transition-smooth"
        >
          Buka Google Sheets →
        </a>
      </Card>

      <Card title="Yang Bisa Diubah di Sana">
        <ul className="text-sm text-textmuted space-y-1.5 list-disc list-inside">
          <li>Koordinat kantor &amp; radius absensi (geofencing)</li>
          <li>Persentase biaya admin QRIS/Shopee</li>
          <li>Jam kerja weekday (Sen–Kam) &amp; weekend (Jum–Ming)</li>
          <li>Persentase bagi hasil: Owner, Adhit, Reno, Infaq</li>
          <li>Token &amp; Chat ID Telegram bot</li>
          <li>Aktif/nonaktifkan backup harian otomatis</li>
        </ul>
      </Card>

      <Card title="Perubahan Berlaku Otomatis">
        <p className="text-sm text-textmuted">
          Backend membaca ulang tab Settings dengan cache 5 menit, jadi perubahan akan otomatis
          berlaku maksimal 5 menit setelah disimpan — tanpa perlu deploy ulang apa pun.
        </p>
      </Card>
    </div>
  );
}

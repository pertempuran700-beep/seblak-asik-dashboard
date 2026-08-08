'use client';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

export default function PerformanceReviewForm({ employee, period, onSuccess, onClose }) {
  const [scores, setScores] = useState({
    hospitality: employee?.details?.hospitality !== undefined ? Number(employee.details.hospitality) : 80,
    product: employee?.details?.product_knowledge !== undefined ? Number(employee.details.product_knowledge) : 80,
    hygiene: employee?.details?.hygiene !== undefined ? Number(employee.details.hygiene) : 80,
    discipline: employee?.details?.discipline !== undefined ? Number(employee.details.discipline) : 80,
    teamwork: employee?.details?.teamwork !== undefined ? Number(employee.details.teamwork) : 80
  });
  
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  // Handler khusus agar bisa menerima input ketikan maupun tarikan slider
  const handleInputChange = (field, value) => {
    let num = parseInt(value, 10);
    if (isNaN(num)) num = 0;
    if (num > 100) num = 100;
    if (num < 0) num = 0;
    setScores(prev => ({ ...prev, [field]: num }));
  };

  const totalScore = Math.round(
    (scores.hospitality * 0.25) + 
    (scores.product * 0.25) + 
    (scores.hygiene * 0.20) +
    (scores.discipline * 0.15) + 
    (scores.teamwork * 0.15)
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.submitPerformanceReview(employee.employee_id, period, scores);
      toast?.showToast('Penilaian kinerja berhasil disimpan');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toast?.showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // Komponen Baris Slider yang sudah ditingkatkan
  const SliderRow = ({ label, weight, field }) => {
    const textColor = scores[field] < 60 ? 'text-danger' : scores[field] < 80 ? 'text-warning' : 'text-success';
    
    return (
      <div className="mb-5 bg-background border border-white/[0.05] p-3 rounded-lg hover:border-white/[0.1] transition-colors">
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-sm font-bold text-white">{label}</p>
            <p className="text-[10px] text-textmuted uppercase tracking-wider mt-0.5">Bobot: {weight}%</p>
          </div>
          
          {/* Angka yang diubah menjadi Input Field agar bisa diketik */}
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              value={scores[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className={`w-16 bg-surface2 border border-white/[0.1] rounded px-2 py-1 text-right text-xl font-black outline-none focus:border-primary transition-colors ${textColor}`}
              style={{ MozAppearance: 'textfield' }} // Menyembunyikan panah atas-bawah default di Firefox
            />
          </div>
        </div>
        
        {/* Slider Input */}
        <input
          type="range" 
          min="0" 
          max="100" 
          value={scores[field]}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className="w-full h-2 bg-surface2 rounded-lg appearance-none cursor-pointer accent-primary hover:accent-primary/80 transition-all"
        />
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Kolom Contekan Untuk Owner */}
      <div className="bg-danger/10 border border-danger/20 p-3 rounded-card text-xs flex justify-between mb-4">
        <div><p className="text-textmuted">Rekap Alpha / Ditolak:</p><p className="font-bold text-danger text-sm">{employee.alpha_count} Kali</p></div>
        <div className="text-right"><p className="text-textmuted">Rekap Terlambat:</p><p className="font-bold text-warning text-sm">{employee.late_count} Kali</p></div>
      </div>
      
      <p className="text-xs text-textmuted mb-2">*Geser bulatan atau klik angka untuk mengetik nilai (0-100) secara manual.</p>
      
      <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-1">
        <SliderRow label="Pelayanan & Kepuasan Pelanggan" weight={25} field="hospitality" />
        <SliderRow label="Skill & Pengetahuan Produk" weight={25} field="product" />
        <SliderRow label="Kebersihan, Kerapian & Sanitasi" weight={20} field="hygiene" />
        <SliderRow label="Kedisiplinan & Efisiensi Waktu" weight={15} field="discipline" />
        <SliderRow label="Kerjasama Tim & Inisiatif" weight={15} field="teamwork" />
      </div>

      <div className="flex justify-between items-center bg-surface2 p-4 rounded-card border border-primary/30 mt-4 shadow-inner">
        <span className="font-bold text-sm">TOTAL SKOR AKHIR:</span>
        <span className="text-3xl font-black text-primary animate-pulse">{totalScore}</span>
      </div>

      <Button type="submit" full disabled={submitting} className="mt-4 py-3 text-sm">
        {submitting ? 'Menyimpan...' : '💾 Simpan Penilaian'}
      </Button>
    </form>
  );
}

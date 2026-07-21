'use client';
import { useState } from 'react';
import { useData } from '@/hooks/useData';
import { api } from '@/lib/api';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import PromoForm from '@/components/forms/PromoForm';
import { formatRupiah } from '@/lib/utils';

export default function PromoPage() {
  const { data: activePromos, refetch: refetchActive } = useData(() => api.getActivePromos(), []);
  const { data: analytics, loading, refetch: refetchAnalytics } = useData(() => api.getPromoAnalytics(), []);
  const [modal, setModal] = useState(false);

  function refetchAll() {
    refetchActive();
    refetchAnalytics();
  }

  const columns = [
    { key: 'promo_name', label: 'Nama Promo' },
    { key: 'promo_code', label: 'Kode', render: (r) => r.promo_code || '-' },
    { key: 'usage_count', label: 'Dipakai' },
    { key: 'total_discount_given', label: 'Total Diskon', render: (r) => formatRupiah(r.total_discount_given) },
    {
      key: 'is_active',
      label: 'Status',
      render: (r) => <Badge variant={r.is_active === true || r.is_active === 'TRUE' ? 'success' : 'neutral'}>{r.is_active === true || r.is_active === 'TRUE' ? 'Aktif' : 'Nonaktif'}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">🏷️ Diskon & Promo</h1>
        <Button onClick={() => setModal(true)}>+ Buat Promo</Button>
      </div>

      <Card title="Promo Aktif Sekarang">
        {(activePromos || []).length === 0 ? (
          <p className="text-textmuted text-sm text-center py-6">Tidak ada promo aktif saat ini.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activePromos.map((p) => (
              <div key={p.promo_id} className="bg-surface2 rounded-input p-3">
                <p className="font-bold text-sm">{p.promo_name}</p>
                {p.promo_code && <Badge variant="primary">{p.promo_code}</Badge>}
                <p className="text-xs text-textmuted mt-1">
                  Diskon {p.discount_type === 'percentage' ? p.discount_value + '%' : formatRupiah(p.discount_value)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Analitik Semua Promo">
        {loading ? <p className="text-textmuted text-sm text-center py-8">Memuat...</p> : <Table columns={columns} rows={analytics || []} />}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Buat Promo Baru">
        <PromoForm onSuccess={refetchAll} onClose={() => setModal(false)} />
      </Modal>
    </div>
  );
}

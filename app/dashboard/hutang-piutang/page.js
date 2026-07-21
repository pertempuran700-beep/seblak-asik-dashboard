'use client';
import { useState } from 'react';
import { useData } from '@/hooks/useData';
import { api } from '@/lib/api';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Tabs from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { formatRupiah } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

function PaymentModal({ record, onClose, onSuccess }) {
  const [amount, setAmount] = useState(record?.remaining || '');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.recordPayment(record.record_id, Number(amount));
      toast?.showToast('Pembayaran tercatat');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toast?.showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={Boolean(record)} onClose={onClose} title={`Catat Pembayaran — ${record?.counterparty}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <p className="text-sm text-textmuted">Sisa tagihan: {formatRupiah(record?.remaining)}</p>
        <Input label="Jumlah Dibayar" type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Button type="submit" full disabled={submitting}>
          {submitting ? 'Menyimpan...' : 'Simpan Pembayaran'}
        </Button>
      </form>
    </Modal>
  );
}

export default function HutangPiutangPage() {
  const { data: records, loading, refetch } = useData(() => api.getAPAR(), []);
  const [tab, setTab] = useState('Payable');
  const [payingRecord, setPayingRecord] = useState(null);

  const filtered = (records || []).filter((r) => r.type === tab);

  const columns = [
    { key: 'counterparty', label: tab === 'Payable' ? 'Vendor' : 'Pelanggan' },
    { key: 'amount', label: 'Total', render: (r) => formatRupiah(r.amount) },
    { key: 'paid_amount', label: 'Terbayar', render: (r) => formatRupiah(r.paid_amount) },
    { key: 'remaining', label: 'Sisa', render: (r) => formatRupiah(r.remaining) },
    { key: 'aging_days', label: 'Aging', render: (r) => (r.aging_days > 0 ? <Badge variant="danger">{r.aging_days} hari</Badge> : <Badge variant="success">Belum jatuh tempo</Badge>) },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={r.status === 'Paid' ? 'success' : r.status === 'Partial' ? 'warning' : 'neutral'}>{r.status}</Badge> },
    {
      key: 'actions',
      label: '',
      render: (r) => r.status !== 'Paid' && <Button variant="ghost" onClick={() => setPayingRecord(r)}>Bayar</Button>,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">📋 Hutang & Piutang</h1>

      <Tabs
        tabs={[
          { value: 'Payable', label: 'Hutang' },
          { value: 'Receivable', label: 'Piutang' },
        ]}
        active={tab}
        onChange={setTab}
      />

      <Card>
        {loading ? <p className="text-textmuted text-sm text-center py-8">Memuat...</p> : <Table columns={columns} rows={filtered} />}
      </Card>

      <PaymentModal record={payingRecord} onClose={() => setPayingRecord(null)} onSuccess={refetch} />
    </div>
  );
}

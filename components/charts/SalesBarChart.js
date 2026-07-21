'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCompactRupiah, formatRupiah } from '@/lib/utils';

export default function SalesBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="label" stroke="#A0A0C0" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#A0A0C0" fontSize={12} tickFormatter={formatCompactRupiah} tickLine={false} axisLine={false} />
        <Tooltip
          formatter={(v) => formatRupiah(v)}
          contentStyle={{ background: '#1A1A3E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}
          labelStyle={{ color: '#FFFFFF' }}
        />
        <Bar dataKey="revenue" fill="#E94560" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

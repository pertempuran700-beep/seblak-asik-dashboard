'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCompactRupiah, formatRupiah } from '@/lib/utils';

export default function SalesLineChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="label" stroke="#A0A0C0" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#A0A0C0" fontSize={12} tickFormatter={formatCompactRupiah} tickLine={false} axisLine={false} />
        <Tooltip
          formatter={(v) => formatRupiah(v)}
          contentStyle={{ background: '#1A1A3E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}
          labelStyle={{ color: '#FFFFFF' }}
        />
        <Line type="monotone" dataKey="revenue" stroke="#F4B400" strokeWidth={2.5} dot={{ fill: '#F4B400', r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

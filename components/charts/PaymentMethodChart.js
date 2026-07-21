'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = { QRIS: '#E94560', Cash: '#F4B400', 'Shopee Transfer': '#00B894' };

export default function PaymentMethodChart({ data }) {
  // data: [{ name: 'QRIS', value: 85 }, ...]
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} label={(d) => `${d.name} ${d.value}%`}>
          {data.map((entry, i) => (
            <Cell key={i} fill={COLORS[entry.name] || '#A0A0C0'} stroke="none" />
          ))}
        </Pie>
        <Tooltip contentStyle={{ background: '#1A1A3E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }} />
        <Legend wrapperStyle={{ fontSize: 12, color: '#A0A0C0' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

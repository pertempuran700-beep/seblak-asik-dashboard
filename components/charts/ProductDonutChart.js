'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#E94560', '#F4B400', '#00B894', '#FDCB6E', '#FF6B6B', '#A0A0C0'];

export default function ProductDonutChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="qty" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
          {data.map((entry, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: '#1A1A3E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}
          labelStyle={{ color: '#FFFFFF' }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#A0A0C0' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

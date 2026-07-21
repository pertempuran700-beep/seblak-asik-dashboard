'use client';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function StockFlowChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="label" stroke="#A0A0C0" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#A0A0C0" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ background: '#1A1A3E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }} />
        <Legend wrapperStyle={{ fontSize: 12, color: '#A0A0C0' }} />
        <Area type="monotone" dataKey="masuk" stroke="#00B894" fill="#00B894" fillOpacity={0.15} name="Masuk" />
        <Area type="monotone" dataKey="keluar" stroke="#FF6B6B" fill="#FF6B6B" fillOpacity={0.15} name="Keluar" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

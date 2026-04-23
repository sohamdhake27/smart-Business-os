import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3 shadow-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{p.dataKey}</span>
          </div>
          <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>₹{Number(p.value).toLocaleString('en-IN')}</span>
        </div>
      ))}
    </div>
  );
};

const SalesChart = ({ data, loading }) => {
  const { isDark } = useTheme();
  const axisColor = isDark ? '#64748b' : '#94a3b8';

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid var(--border)', borderTop: '3px solid var(--accent)' }} />
    </div>
  );

  if (!data || !data.labels?.length) return (
    <div className="h-64 flex flex-col items-center justify-center gap-2" style={{ color: 'var(--text-muted)' }}>
      <span className="text-4xl">📊</span>
      <p className="text-sm">No chart data yet. Add some transactions!</p>
    </div>
  );

  const chartData = data.labels.map((label, i) => ({
    label, sales: data.sales?.[i] || 0, expenses: data.expenses?.[i] || 0, profit: data.profit?.[i] || 0
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
            <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
            <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#f1f5f9'} />
          <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{v}</span>} />
          <Area type="monotone" dataKey="sales" stroke="#6366f1" fill="url(#sg)" strokeWidth={2.5} dot={false} />
          <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#eg)" strokeWidth={2.5} dot={false} />
          <Area type="monotone" dataKey="profit" stroke="#10b981" fill="url(#pg)" strokeWidth={2.5} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
export default SalesChart;

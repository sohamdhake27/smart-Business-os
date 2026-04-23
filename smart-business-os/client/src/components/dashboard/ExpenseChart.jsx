import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import api from '../../services/api';

const COLORS = ['#6366f1','#ef4444','#f59e0b','#10b981','#8b5cf6','#ec4899','#06b6d4','#84cc16'];
const RADIAN = Math.PI / 180;

const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={700}>{`${(percent * 100).toFixed(0)}%`}</text>;
};

const ExpenseChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/category-breakdown?type=expense&period=month')
      .then(res => setData(res.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-48 flex items-center justify-center"><div className="w-6 h-6 rounded-full animate-spin" style={{ border: '2px solid var(--border)', borderTop: '2px solid var(--accent)' }} /></div>;
  if (data.length === 0) return <div className="h-48 flex flex-col items-center justify-center gap-2" style={{ color: 'var(--text-muted)' }}><span className="text-3xl">🍩</span><p className="text-sm">No expense data this month</p></div>;

  const chartData = data.map(d => ({ name: d.category.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase()), value: d.total }));

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" labelLine={false} label={renderLabel}>
            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={val => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']} />
          <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{v}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
export default ExpenseChart;

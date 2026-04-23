import React, { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import api from '../services/api';
import SalesChart from '../components/dashboard/SalesChart';
import ExpenseChart from '../components/dashboard/ExpenseChart';

const Analytics = () => {
  const [chartData, setChartData] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [view, setView] = useState('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [c, m] = await Promise.all([
          api.get(`/analytics/chart-data?view=${view}`),
          api.get('/analytics/monthly-report')
        ]);
        setChartData(c.data.data);
        setMonthlyReport(m.data.data);
      } finally { setLoading(false); }
    };
    fetchData();
  }, [view]);

  const r = monthlyReport?.current;
  const g = monthlyReport?.growth;

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div><h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Analytics</h1><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Deep dive into your business performance</p></div>

      {monthlyReport && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'This Month Sales', value: `₹${(r?.sales || 0).toLocaleString('en-IN')}`, change: g?.sales, color: '#6366f1' },
            { label: 'This Month Expenses', value: `₹${(r?.expenses || 0).toLocaleString('en-IN')}`, change: g?.expenses, color: '#ef4444' },
            { label: 'Net Profit', value: `₹${(r?.profit || 0).toLocaleString('en-IN')}`, change: g?.profit, color: r?.profit >= 0 ? '#10b981' : '#ef4444' },
            { label: 'Profit Margin', value: `${r?.sales > 0 ? ((r?.profit / r?.sales) * 100).toFixed(1) : 0}%`, color: '#8b5cf6' }
          ].map(s => (
            <div key={s.label} className="card p-5">
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              <p className="text-2xl font-bold mb-1" style={{ color: s.color }}>{s.value}</p>
              {s.change !== undefined && (
                <p className="text-xs" style={{ color: parseFloat(s.change) >= 0 ? '#10b981' : '#ef4444' }}>
                  {parseFloat(s.change) >= 0 ? '↑' : '↓'} {Math.abs(s.change)}% vs last month
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div><h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Revenue Trends</h3><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sales, expenses & profit over time</p></div>
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              {['daily','weekly','monthly'].map(v => (
                <button key={v} onClick={() => setView(v)} className="px-3 py-1.5 text-xs font-medium capitalize transition-all"
                  style={view === v ? { background: 'var(--accent)', color: 'white' } : { background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <SalesChart data={chartData} loading={loading} />
        </div>
        <div className="card p-6">
          <div className="mb-6"><h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Expense Breakdown</h3><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Category distribution</p></div>
          <ExpenseChart />
        </div>
      </div>
    </div>
  );
};
export default Analytics;

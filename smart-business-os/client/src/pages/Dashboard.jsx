import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Target, RefreshCw, Plus } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import SalesChart from '../components/dashboard/SalesChart';
import ExpenseChart from '../components/dashboard/ExpenseChart';
import RecentActivity from '../components/dashboard/RecentActivity';
import AIInsights from '../components/ai/AIInsights';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, icon: Icon, gradient, loading }) => (
  <div className={`card p-6 text-white border-0 ${gradient}`}>
    <div className="flex items-start justify-between mb-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20">
        <Icon size={20} className="text-white" />
      </div>
    </div>
    {loading ? (
      <div className="space-y-2">
        <div className="h-7 w-24 rounded-lg bg-white/20 animate-pulse" />
        <div className="h-4 w-16 rounded-lg bg-white/20 animate-pulse" />
      </div>
    ) : (
      <><p className="text-2xl font-bold mb-1">{value}</p><p className="text-sm opacity-80">{title}</p></>
    )}
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const { on } = useSocket();
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [recentTx, setRecentTx] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState('monthly');
  const [period, setPeriod] = useState('month');

  const fetchData = useCallback(async () => {
    try {
      const [s, c, t, i] = await Promise.all([
        api.get(`/transactions/summary?period=${period}`),
        api.get(`/analytics/chart-data?view=${chartView}`),
        api.get('/transactions?limit=5&sortBy=date&sortOrder=desc'),
        api.get('/ai/insights')
      ]);
      setSummary(s.data.data);
      setChartData(c.data.data);
      setRecentTx(t.data.data);
      setInsights(i.data.data);
    } catch {} finally { setLoading(false); }
  }, [period, chartView]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const cleanup = on('dashboard:update', () => { toast.success('📊 Dashboard updated!', { duration: 3000 }); fetchData(); });
    return cleanup;
  }, [on, fetchData]);

  const currency = user?.currency || '₹';

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{user?.businessName || 'Business'} Dashboard</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
            {['week','month','quarter','year'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} className="px-3 py-2 text-xs font-medium capitalize transition-all"
                style={period === p ? { background: 'var(--accent)', color: 'white' } : { background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
                {p}
              </button>
            ))}
          </div>
          <button onClick={fetchData} className="p-2 rounded-xl transition-all hover:rotate-180 duration-300"
            style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            <RefreshCw size={16} />
          </button>
          <Link to="/transactions" className="btn-primary flex items-center gap-2 py-2.5 text-sm">
            <Plus size={16} /> Add Entry
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={`Total Sales (${period})`} value={formatCurrency(summary?.totalSales || 0, currency)} icon={TrendingUp} gradient="stat-gradient-blue" loading={loading} />
        <StatCard title="Total Expenses" value={formatCurrency(summary?.totalExpenses || 0, currency)} icon={TrendingDown} gradient="stat-gradient-red" loading={loading} />
        <StatCard title="Net Profit" value={formatCurrency(summary?.profit || 0, currency)} icon={DollarSign} gradient={summary?.profit >= 0 ? "stat-gradient-green" : "stat-gradient-red"} loading={loading} />
        <StatCard title="Profit Margin" value={`${summary?.profitMargin || 0}%`} icon={Target} gradient="stat-gradient-purple" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div><h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Sales vs Expenses</h3><p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Financial overview</p></div>
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              {['daily','weekly','monthly'].map(v => (
                <button key={v} onClick={() => setChartView(v)} className="px-3 py-1.5 text-xs font-medium capitalize transition-all"
                  style={chartView === v ? { background: 'var(--accent)', color: 'white' } : { background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <SalesChart data={chartData} loading={loading} />
        </div>
        <div className="card p-6">
          <div className="mb-6"><h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Expenses by Category</h3><p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>This month</p></div>
          <ExpenseChart />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity transactions={recentTx} loading={loading} currency={currency} />
        <AIInsights insights={insights?.insights || []} loading={loading} />
      </div>
    </div>
  );
};
export default Dashboard;

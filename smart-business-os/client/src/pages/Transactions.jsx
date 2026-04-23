import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, X, Edit2, Trash2, Check } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

const CATEGORIES = {
  expense: ['rent','salary','marketing','utilities','supplies','equipment','insurance','transport','food','maintenance','taxes','subscription','miscellaneous'],
  sale: ['product_sale','service','consultation','subscription_revenue','refund','other_income']
};
const INITIAL_FORM = { type: 'expense', title: '', amount: '', category: 'miscellaneous', description: '', date: new Date().toISOString().split('T')[0], paymentMethod: 'cash', status: 'completed' };

const TransactionForm = ({ form, setForm, onSubmit, onClose, editMode, loading }) => {
  const cats = CATEGORIES[form.type] || [];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" style={{ background: 'var(--bg-card)' }}>
        <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{editMode ? 'Edit' : 'Add'} Transaction</h3>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="flex rounded-xl p-1" style={{ background: 'var(--bg-primary)' }}>
            {['sale','expense'].map(t => (
              <button key={t} type="button" onClick={() => setForm(p => ({ ...p, type: t, category: CATEGORIES[t][0] }))}
                className="flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all"
                style={form.type === t ? { background: t === 'sale' ? '#10b981' : '#ef4444', color: 'white' } : { color: 'var(--text-muted)' }}>
                {t === 'sale' ? '💚 Sale' : '🔴 Expense'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Title *</label>
              <input type="text" className="input-field" placeholder="e.g. Monthly Rent" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Amount *</label>
              <input type="number" className="input-field" placeholder="0.00" min="0" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Date *</label>
              <input type="date" className="input-field" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Category *</label>
              <select className="input-field" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {cats.map(c => <option key={c} value={c}>{c.replace(/_/g,' ').replace(/\b\w/g, ch => ch.toUpperCase())}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Payment</label>
              <select className="input-field" value={form.paymentMethod} onChange={e => setForm(p => ({ ...p, paymentMethod: e.target.value }))}>
                {['cash','card','upi','bank_transfer','cheque','other'].map(m => <option key={m} value={m}>{m.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Description</label>
              <textarea className="input-field resize-none" rows={2} placeholder="Optional notes..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} />}
              {editMode ? 'Update' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Transactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [filters, setFilters] = useState({ type: 'all', search: '', startDate: '', endDate: '', page: 1 });
  const currency = user?.currency || '₹';

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...filters, limit: 15, sortBy: 'date', sortOrder: 'desc' });
      [...params.entries()].forEach(([k, v]) => { if (!v || v === 'all') params.delete(k); });
      const { data } = await api.get(`/transactions?${params}`);
      setTransactions(data.data);
      setPagination(data.pagination);
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleSubmit = async e => {
    e.preventDefault(); setFormLoading(true);
    try {
      if (editId) { await api.put(`/transactions/${editId}`, form); toast.success('Updated!'); }
      else { await api.post('/transactions', form); toast.success('Added!'); }
      setShowForm(false); setEditId(null); setForm(INITIAL_FORM); fetchTransactions();
    } finally { setFormLoading(false); }
  };

  const handleEdit = tx => {
    setForm({ type: tx.type, title: tx.title, amount: tx.amount, category: tx.category, description: tx.description || '', date: new Date(tx.date).toISOString().split('T')[0], paymentMethod: tx.paymentMethod || 'cash', status: tx.status || 'completed' });
    setEditId(tx._id); setShowForm(true);
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this transaction?')) return;
    await api.delete(`/transactions/${id}`); toast.success('Deleted!'); fetchTransactions();
  };

  const totals = transactions.reduce((acc, tx) => { if (tx.type === 'sale') acc.sales += tx.amount; else acc.expenses += tx.amount; return acc; }, { sales: 0, expenses: 0 });

  return (
    <div className="space-y-6 animate-fadeInUp">
      {showForm && <TransactionForm form={form} setForm={setForm} onSubmit={handleSubmit} onClose={() => { setShowForm(false); setEditId(null); setForm(INITIAL_FORM); }} editMode={!!editId} loading={formLoading} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Transactions</h1><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage all sales & expenses</p></div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Transaction</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{ label: 'Sales', value: totals.sales, color: '#10b981' }, { label: 'Expenses', value: totals.expenses, color: '#ef4444' }, { label: 'Net', value: totals.sales - totals.expenses, color: totals.sales - totals.expenses >= 0 ? '#10b981' : '#ef4444' }].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-lg font-bold" style={{ color: s.color }}>{currency}{Math.abs(s.value).toLocaleString('en-IN')}</p>
          </div>
        ))}
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input type="text" className="input-field pl-9 py-2 text-sm" placeholder="Search transactions..." value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value, page: 1 }))} />
        </div>
        <select className="input-field py-2 text-sm w-auto" value={filters.type} onChange={e => setFilters(p => ({ ...p, type: e.target.value, page: 1 }))}>
          <option value="all">All Types</option><option value="sale">Sales</option><option value="expense">Expenses</option>
        </select>
        <input type="date" className="input-field py-2 text-sm w-auto" value={filters.startDate} onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))} />
        <input type="date" className="input-field py-2 text-sm w-auto" value={filters.endDate} onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))} />
        <button onClick={() => setFilters({ type: 'all', search: '', startDate: '', endDate: '', page: 1 })} className="btn-secondary py-2 text-sm flex items-center gap-1"><X size={14} /> Clear</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}>
                {['Date','Title','Category','Type','Amount','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b" style={{ borderColor: 'var(--border-light)' }}>
                  {[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-3.5 rounded animate-pulse" style={{ background: 'var(--border)', width: j === 1 ? '80%' : '60%' }} /></td>)}
                </tr>
              )) : transactions.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center" style={{ color: 'var(--text-muted)' }}><p className="text-4xl mb-2">📭</p><p>No transactions found. Add your first one!</p></td></tr>
              ) : transactions.map(tx => (
                <tr key={tx._id} className="border-b hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors" style={{ borderColor: 'var(--border-light)' }}>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(tx.date)}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold truncate max-w-[140px]" style={{ color: 'var(--text-primary)' }}>{tx.title}</p>
                    {tx.description && <p className="text-xs truncate max-w-[140px]" style={{ color: 'var(--text-muted)' }}>{tx.description}</p>}
                  </td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>{tx.category?.replace(/_/g,' ')}</span></td>
                  <td className="px-4 py-3"><span className="text-xs font-semibold px-2 py-1 rounded-lg" style={tx.type === 'sale' ? { background: 'rgba(16,185,129,0.1)', color: '#10b981' } : { background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>{tx.type}</span></td>
                  <td className="px-4 py-3 font-bold" style={{ color: tx.type === 'sale' ? '#10b981' : '#ef4444' }}>{tx.type === 'sale' ? '+' : '-'}{currency}{tx.amount?.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(tx)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"><Edit2 size={14} style={{ color: '#3b82f6' }} /></button>
                      <button onClick={() => handleDelete(tx._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={14} style={{ color: '#ef4444' }} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination.pages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Page {pagination.page} of {pagination.pages} ({pagination.total} total)</p>
            <div className="flex gap-2">
              <button disabled={filters.page <= 1} onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">← Prev</button>
              <button disabled={filters.page >= pagination.pages} onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default Transactions;

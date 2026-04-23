import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/formatters';

const RecentActivity = ({ transactions, loading, currency }) => (
  <div className="card p-6">
    <div className="flex items-center justify-between mb-5">
      <div>
        <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Recent Activity</h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Latest transactions</p>
      </div>
      <Link to="/transactions" className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>View All →</Link>
    </div>
    {loading ? (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-9 h-9 rounded-xl" style={{ background: 'var(--border)' }} />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 rounded-md w-2/3" style={{ background: 'var(--border)' }} />
              <div className="h-2.5 rounded-md w-1/3" style={{ background: 'var(--border)' }} />
            </div>
            <div className="h-4 w-16 rounded-md" style={{ background: 'var(--border)' }} />
          </div>
        ))}
      </div>
    ) : transactions.length === 0 ? (
      <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
        <p className="text-3xl mb-2">📭</p>No transactions yet
      </div>
    ) : (
      <div className="space-y-3">
        {transactions.map(tx => (
          <div key={tx._id} className="flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-gray-50 dark:hover:bg-slate-800/50">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: tx.type === 'sale' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
              {tx.type === 'sale' ? <ArrowUpRight size={16} style={{ color: '#10b981' }} /> : <ArrowDownRight size={16} style={{ color: '#ef4444' }} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{tx.title}</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{tx.category?.replace(/_/g,' ')} · {formatDate(tx.date)}</p>
            </div>
            <span className="text-sm font-bold flex-shrink-0" style={{ color: tx.type === 'sale' ? '#10b981' : '#ef4444' }}>
              {tx.type === 'sale' ? '+' : '-'}{currency}{tx.amount?.toLocaleString('en-IN')}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
);
export default RecentActivity;

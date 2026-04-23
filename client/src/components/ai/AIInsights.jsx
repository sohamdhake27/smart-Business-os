import React from 'react';
import { Sparkles } from 'lucide-react';

const PRIORITY_COLORS = { critical: '#ef4444', high: '#f59e0b', medium: '#6366f1', low: '#10b981' };

const AIInsights = ({ insights, loading }) => (
  <div className="card p-6">
    <div className="flex items-center gap-2 mb-5">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
        <Sparkles size={16} className="text-white" />
      </div>
      <div>
        <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>AI Insights</h3>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Smart recommendations</p>
      </div>
    </div>
    {loading ? (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-3 rounded-xl animate-pulse" style={{ background: 'var(--bg-primary)' }}>
            <div className="h-3 w-3/4 rounded mb-2" style={{ background: 'var(--border)' }} />
            <div className="h-2.5 w-full rounded" style={{ background: 'var(--border)' }} />
          </div>
        ))}
      </div>
    ) : insights.length === 0 ? (
      <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
        <p className="text-3xl mb-2">🤖</p>Add more transactions to get AI insights
      </div>
    ) : (
      <div className="space-y-3">
        {insights.slice(0, 4).map((insight, i) => (
          <div key={i} className="p-3 rounded-xl flex gap-3 items-start"
            style={{ background: 'var(--bg-primary)', borderLeft: `3px solid ${PRIORITY_COLORS[insight.priority] || '#6366f1'}` }}>
            <span className="text-lg flex-shrink-0">{insight.icon}</span>
            <div>
              <p className="text-xs font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>{insight.title}</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{insight.message}</p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);
export default AIInsights;

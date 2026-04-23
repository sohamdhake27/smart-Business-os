import React, { useEffect, useState } from 'react';
import { getInsights } from '../../api/ai.api';

const InsightsWidget = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getInsights()
      .then((response) => setData(response.data.data))
      .catch(() => setError('Unable to load AI insights right now.'));
  }, []);

  if (error) {
    return <div className="card p-4 text-sm" style={{ color: 'var(--text-muted)' }}>{error}</div>;
  }

  if (!data) {
    return <div className="card p-4 text-sm" style={{ color: 'var(--text-muted)' }}>Loading AI insights...</div>;
  }

  return (
    <div className="card p-5 space-y-3">
      <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>AI Insights Snapshot</h3>
      {data.insights.slice(0, 3).map((item) => (
        <div key={item.title} className="rounded-xl p-3" style={{ background: 'var(--bg-primary)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.message}</p>
        </div>
      ))}
    </div>
  );
};

export default InsightsWidget;

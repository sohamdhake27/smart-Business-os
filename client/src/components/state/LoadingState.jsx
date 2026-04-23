const LoadingState = ({ title = 'Loading', description = 'Fetching data...' }) => (
  <div className="card p-8 text-center">
    <div className="w-10 h-10 rounded-full animate-spin mx-auto mb-4" style={{ border: '3px solid var(--border)', borderTop: '3px solid var(--accent)' }} />
    <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h3>
    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{description}</p>
  </div>
);

export default LoadingState;

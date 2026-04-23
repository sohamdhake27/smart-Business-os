const ErrorState = ({ title = 'Something went wrong', description, action }) => (
  <div className="card p-8 text-center border border-red-200">
    <div className="text-4xl mb-3">Error</div>
    <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h3>
    <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{description}</p>
    {action}
  </div>
);

export default ErrorState;

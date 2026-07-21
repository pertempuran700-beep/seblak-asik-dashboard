export default function Card({ title, action, children, className = '' }) {
  return (
    <div
      className={`bg-surface border border-white/[0.08] rounded-card p-5 ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-sm font-bold text-textmuted uppercase tracking-wide">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function MetricCard({ label, value, change, changeType = 'neutral' }) {
  const changeColor =
    changeType === 'up' ? 'text-success' : changeType === 'down' ? 'text-danger' : 'text-textmuted';

  return (
    <div className="bg-surface border border-white/[0.08] rounded-card p-5 hover:shadow-glow transition-smooth">
      <p className="text-xs text-textmuted font-light mb-2">{label}</p>
      <p className="text-2xl font-bold text-text">{value}</p>
      {change && <p className={`text-xs mt-1 ${changeColor}`}>{change}</p>}
    </div>
  );
}

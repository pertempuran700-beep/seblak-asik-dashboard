export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && <label className="block text-xs text-textmuted mb-1.5">{label}</label>}
      <input
        className={`w-full bg-surface2 border border-white/[0.08] rounded-input px-3 py-2.5 text-sm text-text placeholder:text-textmuted/50 focus:border-primary outline-none ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}

export function Select({ label, options, error, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && <label className="block text-xs text-textmuted mb-1.5">{label}</label>}
      <select
        className={`w-full bg-surface2 border border-white/[0.08] rounded-input px-3 py-2.5 text-sm text-text focus:border-primary outline-none ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}

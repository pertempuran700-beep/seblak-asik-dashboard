export default function DatePicker({ label, value, onChange, ...props }) {
  return (
    <div>
      {label && <label className="block text-xs text-textmuted mb-1.5">{label}</label>}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-surface2 border border-white/[0.08] rounded-input px-3 py-2.5 text-sm text-text focus:border-primary outline-none [color-scheme:dark]"
        {...props}
      />
    </div>
  );
}

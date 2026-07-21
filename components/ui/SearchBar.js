export default function SearchBar({ value, onChange, placeholder = 'Cari...' }) {
  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textmuted"
        fill="none" viewBox="0 0 24 24" stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-surface2 border border-white/[0.08] rounded-input pl-9 pr-3 py-2.5 text-sm text-text placeholder:text-textmuted/50 focus:border-primary outline-none"
      />
    </div>
  );
}

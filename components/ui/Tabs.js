export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 bg-surface2 rounded-button p-1 w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`px-4 py-2 text-sm font-bold rounded-button transition-smooth ${
            active === tab.value ? 'bg-primary text-white' : 'text-textmuted hover:text-text'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

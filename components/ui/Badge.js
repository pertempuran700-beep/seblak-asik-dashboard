const VARIANTS = {
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
  neutral: 'bg-white/10 text-textmuted',
  primary: 'bg-primary/15 text-primary',
};

export default function Badge({ children, variant = 'neutral' }) {
  return (
    <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${VARIANTS[variant]}`}>
      {children}
    </span>
  );
}

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className = '',
  full = false,
}) {
  const base =
    'rounded-button px-4 py-2.5 text-sm font-bold transition-smooth disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-primary text-white hover:shadow-glow',
    secondary: 'bg-surface2 text-text hover:bg-white/10',
    ghost: 'bg-transparent text-textmuted hover:text-text',
    danger: 'bg-danger text-white hover:opacity-90',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${full ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

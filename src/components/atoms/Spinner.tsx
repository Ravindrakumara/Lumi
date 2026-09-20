interface SpinnerProps {
  size?: number;
  className?: string;
}

export default function Spinner({ size = 20, className = "" }: SpinnerProps) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-slate-300 border-t-brand-500 ${className}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}

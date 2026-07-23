export function Pennant({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 160" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <line x1="20" y1="10" x2="20" y2="150" stroke="url(#pennantGradient)" strokeWidth="6" strokeLinecap="round" />
      <path d="M20 18 L128 42 L20 66 Z" fill="url(#pennantGradient)" opacity="0.9" />
      <defs>
        <linearGradient id="pennantGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2f7dff" />
          <stop offset="100%" stopColor="#17d9c4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function GoalPost({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 180" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g stroke="url(#goalPostGradient)" strokeWidth="8" strokeLinecap="round" fill="none">
        <line x1="80" y1="70" x2="80" y2="175" />
        <line x1="20" y1="70" x2="20" y2="35" />
        <line x1="140" y1="70" x2="140" y2="35" />
        <line x1="20" y1="70" x2="140" y2="70" />
      </g>
      <defs>
        <linearGradient id="goalPostGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#17d9c4" />
          <stop offset="100%" stopColor="#2f7dff" />
        </linearGradient>
      </defs>
    </svg>
  );
}

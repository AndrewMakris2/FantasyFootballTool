export function StadiumLights({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <line x1="80" y1="30" x2="80" y2="150" stroke="url(#lightsGradient)" strokeWidth="6" strokeLinecap="round" />
      <g stroke="url(#lightsGradient)" strokeWidth="5" strokeLinecap="round">
        <line x1="35" y1="30" x2="125" y2="30" />
        <line x1="35" y1="30" x2="45" y2="10" />
        <line x1="60" y1="30" x2="66" y2="8" />
        <line x1="85" y1="30" x2="85" y2="6" />
        <line x1="110" y1="30" x2="104" y2="8" />
        <line x1="125" y1="30" x2="118" y2="10" />
      </g>
      <g fill="url(#lightsGradient)" opacity="0.9">
        <circle cx="45" cy="10" r="5" />
        <circle cx="66" cy="8" r="5" />
        <circle cx="85" cy="6" r="5" />
        <circle cx="104" cy="8" r="5" />
        <circle cx="118" cy="10" r="5" />
      </g>
      <defs>
        <linearGradient id="lightsGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2ee2f5" />
          <stop offset="100%" stopColor="#9179fb" />
        </linearGradient>
      </defs>
    </svg>
  );
}

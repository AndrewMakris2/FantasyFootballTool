export function FootballIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 120" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M20 60 C20 25, 60 5, 100 5 C140 5, 180 25, 180 60 C180 95, 140 115, 100 115 C60 115, 20 95, 20 60 Z"
        fill="url(#footballGradient)"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="2"
      />
      <path d="M35 60 L165 60" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none" />
      <g stroke="rgba(255,255,255,0.5)" strokeWidth="3" strokeLinecap="round">
        <line x1="82" y1="50" x2="82" y2="70" />
        <line x1="93" y1="47" x2="93" y2="73" />
        <line x1="104" y1="47" x2="104" y2="73" />
        <line x1="115" y1="50" x2="115" y2="70" />
      </g>
      <defs>
        <linearGradient id="footballGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9179fb" />
          <stop offset="55%" stopColor="#5b9bff" />
          <stop offset="100%" stopColor="#2ee2f5" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const KNOWN_POSITIONS = new Set(["QB", "RB", "WR", "TE", "K", "DEF", "PICK"]);

export function PositionBadge({ position }: { position: string }) {
  const variant = KNOWN_POSITIONS.has(position) ? position : "UNK";
  return <span className={`position-badge position-badge--${variant}`}>{position}</span>;
}

import { teamColor } from "../lib/teamColors";

export function TeamTag({ team }: { team: string | null | undefined }) {
  if (!team) return <span>—</span>;
  const color = teamColor(team);
  return (
    <span className="team-tag">
      <span className="team-tag__dot" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      {team}
    </span>
  );
}

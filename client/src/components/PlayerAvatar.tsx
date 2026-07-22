import { useState } from "react";

interface PlayerAvatarProps {
  playerId: string;
  name: string;
  position: string;
  team: string | null;
  size?: "sm" | "md" | "lg";
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PlayerAvatar({ playerId, name, position, team, size = "md" }: PlayerAvatarProps) {
  const [errored, setErrored] = useState(false);

  const src =
    position === "DEF" && team
      ? `https://sleepercdn.com/images/team_logos/nfl/${team.toLowerCase()}.png`
      : `https://sleepercdn.com/content/nfl/players/thumb/${playerId}.jpg`;

  if (errored) {
    return <div className={`player-avatar player-avatar--${size} player-avatar--fallback`}>{initials(name)}</div>;
  }

  return (
    <img
      className={`player-avatar player-avatar--${size} ${position === "DEF" ? "player-avatar--logo" : ""}`}
      src={src}
      alt={name}
      loading="lazy"
      onError={() => setErrored(true)}
    />
  );
}

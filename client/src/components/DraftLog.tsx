import type { DraftPick } from "../types/draft";
import type { PlayerProfile } from "../types/player";
import { PlayerAvatar } from "./PlayerAvatar";
import { PositionBadge } from "./PositionBadge";

interface DraftLogProps {
  picks: DraftPick[];
  playersById: Map<string, PlayerProfile>;
  teamLabel: (teamIndex: number) => string;
}

export function DraftLog({ picks, playersById, teamLabel }: DraftLogProps) {
  const reversed = [...picks].reverse();

  if (reversed.length === 0) {
    return <p className="empty-state">No picks yet — the draft is about to start.</p>;
  }

  return (
    <ul className="draft-log">
      {reversed.map((pick) => {
        const player = playersById.get(pick.playerId);
        if (!player) return null;
        return (
          <li key={pick.overallPick} className="draft-log__row">
            <span className="draft-log__pick">{pick.round}.{String(pick.overallPick).padStart(3, "0")}</span>
            <PlayerAvatar playerId={player.playerId} name={player.name} position={player.position} team={player.team} size="sm" />
            <span className="draft-log__name">{player.name}</span>
            <PositionBadge position={player.position} />
            <span className="draft-log__slot">{pick.slot}</span>
            <span className="draft-log__team">{teamLabel(pick.teamIndex)}</span>
          </li>
        );
      })}
    </ul>
  );
}

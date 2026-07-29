import { Link } from "react-router-dom";
import type { Player } from "../types/league";
import { byeWeekFor } from "../lib/byeWeeks";
import { PositionBadge } from "./PositionBadge";
import { PlayerAvatar } from "./PlayerAvatar";

export function RosterTable({ roster }: { roster: Player[] }) {
  if (roster.length === 0) {
    return (
      <p className="empty-state">
        No roster yet — this league likely hasn't drafted. Try a{" "}
        <Link to="/mock-draft">mock draft</Link> while you wait.
      </p>
    );
  }
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Player</th>
          <th>Pos</th>
          <th>Team</th>
          <th>Bye</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {roster.map((player) => (
          <tr key={player.playerId}>
            <td>
              <Link to={`/players/${player.playerId}`} className="table-player-link">
                <PlayerAvatar
                  playerId={player.playerId}
                  name={player.name}
                  position={player.position}
                  team={player.team}
                  size="sm"
                />
                <span>{player.name}</span>
              </Link>
            </td>
            <td><PositionBadge position={player.position} /></td>
            <td>{player.team ?? "FA"}</td>
            <td>{byeWeekFor(player.team) ?? "—"}</td>
            <td>
              {player.injuryStatus ? <span className="injury-badge">{player.injuryStatus}</span> : "Healthy"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

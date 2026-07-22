import { Link } from "react-router-dom";
import type { Player } from "../types/league";
import { PositionBadge } from "./PositionBadge";
import { PlayerAvatar } from "./PlayerAvatar";

export function RosterTable({ roster }: { roster: Player[] }) {
  if (roster.length === 0) {
    return <p className="empty-state">No roster data available.</p>;
  }
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Player</th>
          <th>Pos</th>
          <th>Team</th>
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
          </tr>
        ))}
      </tbody>
    </table>
  );
}

import { Link } from "react-router-dom";
import type { TrendingPlayer } from "../api/trendingPlayers";
import { PositionBadge } from "./PositionBadge";
import { PlayerAvatar } from "./PlayerAvatar";

export function TrendingTable({ players }: { players: TrendingPlayer[] }) {
  if (players.length === 0) {
    return <p className="empty-state">No trending data available.</p>;
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Player</th>
          <th>Pos</th>
          <th>Team</th>
          <th>Trend (24h)</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {players.map((player, index) => (
          <tr key={player.playerId}>
            <td>{index + 1}</td>
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
            <td>{player.team}</td>
            <td className="trending-count">{player.trendCount.toLocaleString()}</td>
            <td>
              {player.injuryStatus ? <span className="injury-badge">{player.injuryStatus}</span> : "Healthy"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

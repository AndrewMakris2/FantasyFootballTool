import { Link } from "react-router-dom";
import type { TrendingPlayer } from "../api/trendingPlayers";
import { PositionBadge } from "./PositionBadge";
import { PlayerAvatar } from "./PlayerAvatar";
import { TeamTag } from "./TeamTag";
import { WatchlistButton } from "./WatchlistButton";

interface TrendingTableProps {
  players: TrendingPlayer[];
  type: "add" | "drop";
}

export function TrendingTable({ players, type }: TrendingTableProps) {
  if (players.length === 0) {
    return <p className="empty-state">No trending data available.</p>;
  }

  const countLabel = type === "add" ? "Leagues Adding (24h)" : "Leagues Dropping (24h)";

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Player</th>
          <th>Pos</th>
          <th>Team</th>
          <th title="Number of Sleeper leagues where this player was added/dropped in the last 24 hours">
            {countLabel}
          </th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {players.map((player, index) => (
          <tr key={player.playerId}>
            <td>{index + 1}</td>
            <td>
              <div className="table-player-cell">
                <WatchlistButton playerId={player.playerId} />
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
              </div>
            </td>
            <td><PositionBadge position={player.position} /></td>
            <td><TeamTag team={player.team} /></td>
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

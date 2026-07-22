import type { TrendingPlayer } from "../api/trendingPlayers";

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
            <td>{player.name}</td>
            <td>{player.position}</td>
            <td>{player.team}</td>
            <td>{player.trendCount.toLocaleString()}</td>
            <td>
              {player.injuryStatus ? <span className="injury-badge">{player.injuryStatus}</span> : "Healthy"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

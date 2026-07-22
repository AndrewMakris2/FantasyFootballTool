import type { PlayerProfile } from "../types/player";

function formatHeight(inches: number | null): string {
  if (inches === null) return "—";
  const feet = Math.floor(inches / 12);
  const remainder = inches % 12;
  return `${feet}'${remainder}"`;
}

export function PlayersTable({ players }: { players: PlayerProfile[] }) {
  if (players.length === 0) {
    return <p className="empty-state">No players match these filters.</p>;
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Player</th>
          <th>Pos</th>
          <th>Team</th>
          <th>Age</th>
          <th>Ht/Wt</th>
          <th>College</th>
          <th>Exp</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {players.map((player) => (
          <tr key={player.playerId}>
            <td>
              {player.name}
              {player.jerseyNumber !== null && (
                <span className="players-table__number"> #{player.jerseyNumber}</span>
              )}
            </td>
            <td>{player.position}</td>
            <td>{player.team}</td>
            <td>{player.age ?? "—"}</td>
            <td>
              {formatHeight(player.heightInches)}
              {player.weightLbs !== null ? ` / ${player.weightLbs} lb` : ""}
            </td>
            <td>{player.college ?? "—"}</td>
            <td>{player.yearsExp ?? "—"}</td>
            <td>
              {player.injuryStatus ? (
                <span className="injury-badge">{player.injuryStatus}</span>
              ) : (
                "Healthy"
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

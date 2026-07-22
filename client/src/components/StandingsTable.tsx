import type { TeamStanding } from "../types/league";

export function StandingsTable({ standings }: { standings: TeamStanding[] }) {
  if (standings.length === 0) {
    return <p className="empty-state">No standings data available.</p>;
  }
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Team</th>
          <th>Record</th>
          <th>PF</th>
          <th>PA</th>
        </tr>
      </thead>
      <tbody>
        {standings.map((team) => (
          <tr key={team.teamId}>
            <td>{team.rank}</td>
            <td>{team.teamName}</td>
            <td>
              {team.record.wins}-{team.record.losses}
              {team.record.ties > 0 ? `-${team.record.ties}` : ""}
            </td>
            <td>{team.pointsFor.toFixed(1)}</td>
            <td>{team.pointsAgainst.toFixed(1)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

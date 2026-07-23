import { Link } from "react-router-dom";
import type { PlayerProfile } from "../types/player";
import type { TradeValueEntry } from "../types/tradeValue";
import { PositionBadge } from "./PositionBadge";
import { PlayerAvatar } from "./PlayerAvatar";
import { TeamTag } from "./TeamTag";
import { WatchlistButton } from "./WatchlistButton";
import { medalClass } from "../lib/medal";

function formatHeight(inches: number | null): string {
  if (inches === null) return "—";
  const feet = Math.floor(inches / 12);
  const remainder = inches % 12;
  return `${feet}'${remainder}"`;
}

interface PlayersTableProps {
  players: PlayerProfile[];
  values: Record<string, TradeValueEntry>;
}

export function PlayersTable({ players, values }: PlayersTableProps) {
  if (players.length === 0) {
    return <p className="empty-state">No players match these filters.</p>;
  }

  return (
    <div className="data-table-scroll data-table-scroll--frozen-first">
      <table className="data-table">
        <thead>
          <tr>
            <th>Player</th>
            <th>Rank</th>
            <th>Value</th>
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
          {players.map((player) => {
            const entry = values[player.playerId];
            return (
              <tr key={player.playerId}>
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
                      <span>
                        {player.name}
                        {player.jerseyNumber !== null && (
                          <span className="players-table__number"> No. {player.jerseyNumber}</span>
                        )}
                      </span>
                    </Link>
                  </div>
                </td>
                <td>
                  {entry ? <span className={medalClass(entry.overallRank)}>#{entry.overallRank}</span> : "—"}
                </td>
                <td>{entry ? entry.value.toLocaleString() : "Unranked"}</td>
                <td><PositionBadge position={player.position} /></td>
                <td><TeamTag team={player.team} /></td>
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

import { useMemo, useState } from "react";
import type { PlayerProfile } from "../types/player";
import type { TradeValueEntry } from "../types/tradeValue";
import { PlayerAvatar } from "./PlayerAvatar";
import { PositionBadge } from "./PositionBadge";

const POSITIONS = ["ALL", "QB", "RB", "WR", "TE", "K", "DEF"];

interface AvailablePlayersPanelProps {
  players: PlayerProfile[];
  values: Record<string, TradeValueEntry>;
  onDraft: (playerId: string) => void;
  canDraft: boolean;
}

export function AvailablePlayersPanel({ players, values, onDraft, canDraft }: AvailablePlayersPanelProps) {
  const [position, setPosition] = useState("ALL");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return players
      .filter((p) => (position === "ALL" ? true : p.position === position))
      .filter((p) => (query === "" ? true : p.name.toLowerCase().includes(query)))
      .sort((a, b) => {
        const rankA = values[a.playerId]?.overallRank ?? Infinity;
        const rankB = values[b.playerId]?.overallRank ?? Infinity;
        return rankA - rankB;
      })
      .slice(0, 100);
  }, [players, position, search, values]);

  return (
    <div className="available-players">
      <div className="available-players__tabs">
        {POSITIONS.map((pos) => (
          <button
            key={pos}
            type="button"
            className={`available-players__tab ${position === pos ? "available-players__tab--active" : ""}`}
            onClick={() => setPosition(pos)}
          >
            {pos}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Search available players..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="available-players__scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Pos</th>
              <th>Team</th>
              <th>Value</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((player) => {
              const entry = values[player.playerId];
              return (
                <tr key={player.playerId}>
                  <td>{entry ? `#${entry.overallRank}` : "—"}</td>
                  <td>
                    <span className="table-player-link">
                      <PlayerAvatar
                        playerId={player.playerId}
                        name={player.name}
                        position={player.position}
                        team={player.team}
                        size="sm"
                      />
                      {player.name}
                    </span>
                  </td>
                  <td><PositionBadge position={player.position} /></td>
                  <td>{player.team}</td>
                  <td>{entry ? entry.value.toLocaleString() : "Unranked"}</td>
                  <td>
                    <button type="button" disabled={!canDraft} onClick={() => onDraft(player.playerId)}>
                      Draft
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-state">
                  No players match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

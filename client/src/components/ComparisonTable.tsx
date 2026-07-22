import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { PlayerProfile } from "../types/player";
import type { TradeValueEntry } from "../types/tradeValue";
import { PositionBadge } from "./PositionBadge";
import { PlayerAvatar } from "./PlayerAvatar";

function formatHeight(inches: number | null): string {
  if (inches === null) return "—";
  const feet = Math.floor(inches / 12);
  const remainder = inches % 12;
  return `${feet}'${remainder}"`;
}

interface ComparisonTableProps {
  players: PlayerProfile[];
  values: Record<string, TradeValueEntry>;
  onRemove: (playerId: string) => void;
}

export function ComparisonTable({ players, values, onRemove }: ComparisonTableProps) {
  if (players.length === 0) {
    return <p className="empty-state">Add at least two players to compare them.</p>;
  }

  const rows: [string, (p: PlayerProfile) => ReactNode][] = [
    ["Rank", (p) => (values[p.playerId] ? `#${values[p.playerId].overallRank}` : "—")],
    ["Value", (p) => (values[p.playerId] ? values[p.playerId].value.toLocaleString() : "Unranked")],
    ["Position", (p) => <PositionBadge position={p.position} />],
    ["Team", (p) => p.team],
    ["Age", (p) => p.age ?? "—"],
    ["Height/Weight", (p) => `${formatHeight(p.heightInches)}${p.weightLbs !== null ? ` / ${p.weightLbs} lb` : ""}`],
    ["College", (p) => p.college ?? "—"],
    ["Experience", (p) => (p.yearsExp !== null ? `${p.yearsExp} yrs` : "—")],
    ["Status", (p) => (p.injuryStatus ? <span className="injury-badge">{p.injuryStatus}</span> : "Healthy")],
  ];

  return (
    <div className="comparison-scroll">
      <table className="data-table comparison-table">
        <thead>
          <tr>
            <th>Attribute</th>
            {players.map((p) => (
              <th key={p.playerId}>
                <div className="comparison-table__player">
                  <PlayerAvatar playerId={p.playerId} name={p.name} position={p.position} team={p.team} size="sm" />
                  <Link to={`/players/${p.playerId}`}>{p.name}</Link>
                  <button type="button" className="trade-side__remove" onClick={() => onRemove(p.playerId)}>
                    &times;
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, render]) => (
            <tr key={label}>
              <td className="comparison-table__label">{label}</td>
              {players.map((p) => (
                <td key={p.playerId}>{render(p)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

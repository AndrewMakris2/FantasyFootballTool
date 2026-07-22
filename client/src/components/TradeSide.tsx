import { useState } from "react";
import type { TradeValueEntry } from "../types/tradeValue";

export interface TradeCandidate {
  playerId: string;
  name: string;
  position: string;
  team: string | null;
}

interface TradeSideProps {
  label: string;
  candidates: TradeCandidate[];
  selected: TradeCandidate[];
  values: Record<string, TradeValueEntry>;
  onAdd: (player: TradeCandidate) => void;
  onRemove: (playerId: string) => void;
}

export function TradeSide({ label, candidates, selected, values, onAdd, onRemove }: TradeSideProps) {
  const [search, setSearch] = useState("");

  const selectedIds = new Set(selected.map((p) => p.playerId));
  const query = search.trim().toLowerCase();
  const matches =
    query === ""
      ? []
      : candidates.filter((p) => !selectedIds.has(p.playerId) && p.name.toLowerCase().includes(query)).slice(0, 8);

  const total = selected.reduce((sum, p) => sum + (values[p.playerId]?.value ?? 0), 0);
  const unrankedCount = selected.filter((p) => !values[p.playerId]).length;

  return (
    <div className="trade-side">
      <h3>{label}</h3>
      <input
        type="text"
        placeholder="Search to add a player..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {matches.length > 0 && (
        <ul className="trade-side__matches">
          {matches.map((player) => (
            <li key={player.playerId}>
              <button
                type="button"
                onClick={() => {
                  onAdd(player);
                  setSearch("");
                }}
              >
                {player.name} ({player.position}{player.team ? ` - ${player.team}` : ""})
              </button>
            </li>
          ))}
        </ul>
      )}

      <ul className="trade-side__selected">
        {selected.length === 0 && <li className="empty-state">No players added yet.</li>}
        {selected.map((player) => {
          const entry = values[player.playerId];
          return (
            <li key={player.playerId}>
              <span>
                {player.name} ({player.position}{player.team ? ` - ${player.team}` : ""})
              </span>
              <span className="trade-side__value">{entry ? entry.value.toLocaleString() : "Unranked"}</span>
              <button type="button" className="trade-side__remove" onClick={() => onRemove(player.playerId)}>
                &times;
              </button>
            </li>
          );
        })}
      </ul>

      <p className="trade-side__total">
        Total value: {total.toLocaleString()}
        {unrankedCount > 0 ? ` (${unrankedCount} unranked player${unrankedCount > 1 ? "s" : ""} not counted)` : ""}
      </p>
    </div>
  );
}

import type { TradeValueEntry } from "../types/tradeValue";
import { PlayerSearchAdd, type SearchCandidate } from "./PlayerSearchAdd";

export type TradeCandidate = SearchCandidate;

interface TradeSideProps {
  label: string;
  candidates: TradeCandidate[];
  selected: TradeCandidate[];
  values: Record<string, TradeValueEntry>;
  onAdd: (player: TradeCandidate) => void;
  onRemove: (playerId: string) => void;
}

export function TradeSide({ label, candidates, selected, values, onAdd, onRemove }: TradeSideProps) {
  const selectedIds = new Set(selected.map((p) => p.playerId));

  const total = selected.reduce((sum, p) => sum + (values[p.playerId]?.value ?? 0), 0);
  const unrankedCount = selected.filter((p) => !values[p.playerId]).length;

  return (
    <div className="trade-side">
      <h3>{label}</h3>
      <PlayerSearchAdd candidates={candidates} excludeIds={selectedIds} onAdd={onAdd} />

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

import { useState } from "react";

export interface SearchCandidate {
  playerId: string;
  name: string;
  position: string;
  team: string | null;
}

interface PlayerSearchAddProps<T extends SearchCandidate> {
  candidates: T[];
  excludeIds: Set<string>;
  onAdd: (player: T) => void;
  placeholder?: string;
}

export function PlayerSearchAdd<T extends SearchCandidate>({
  candidates,
  excludeIds,
  onAdd,
  placeholder = "Search to add a player...",
}: PlayerSearchAddProps<T>) {
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();
  const matches =
    query === ""
      ? []
      : candidates.filter((p) => !excludeIds.has(p.playerId) && p.name.toLowerCase().includes(query)).slice(0, 8);

  return (
    <>
      <input type="text" placeholder={placeholder} value={search} onChange={(e) => setSearch(e.target.value)} />
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
                {player.name} ({player.position}
                {player.team ? ` - ${player.team}` : ""})
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPlayers } from "../api/players";
import { PlayersTable } from "../components/PlayersTable";

const POSITIONS = ["QB", "RB", "WR", "TE", "K", "DEF"];

export function Players() {
  const { data, isLoading, isError, error } = useQuery({ queryKey: ["players"], queryFn: getPlayers });
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("ALL");
  const [team, setTeam] = useState("ALL");

  const teams = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.players.map((p) => p.team))].sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const query = search.trim().toLowerCase();
    return data.players
      .filter((p) => (position === "ALL" ? true : p.position === position))
      .filter((p) => (team === "ALL" ? true : p.team === team))
      .filter((p) => (query === "" ? true : p.name.toLowerCase().includes(query)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data, search, position, team]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Player Database</h1>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={position} onChange={(e) => setPosition(e.target.value)}>
          <option value="ALL">All positions</option>
          {POSITIONS.map((pos) => (
            <option key={pos} value={pos}>
              {pos}
            </option>
          ))}
        </select>
        <select value={team} onChange={(e) => setTeam(e.target.value)}>
          <option value="ALL">All teams</option>
          {teams.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p>Loading players...</p>}
      {isError && <p className="error-text">{(error as Error).message}</p>}

      {data && (
        <>
          <p className="empty-state">
            {filtered.length} of {data.players.length} players
          </p>
          <PlayersTable players={filtered} />
        </>
      )}
    </div>
  );
}

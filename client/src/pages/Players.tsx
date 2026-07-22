import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPlayers } from "../api/players";
import { getTradeValues } from "../api/tradeValues";
import { PlayersTable } from "../components/PlayersTable";
import { FORMAT_PARAMS, type RankingFormat } from "../lib/rankingFormats";

const POSITIONS = ["QB", "RB", "WR", "TE", "K", "DEF"];

export function Players() {
  const { data, isLoading, isError, error } = useQuery({ queryKey: ["players"], queryFn: getPlayers });
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("ALL");
  const [team, setTeam] = useState("ALL");
  const [format, setFormat] = useState<RankingFormat>("full");
  const [health, setHealth] = useState("ALL");
  const [rookiesOnly, setRookiesOnly] = useState(false);
  const [rankedOnly, setRankedOnly] = useState(false);

  const { dynasty, ppr } = FORMAT_PARAMS[format];
  const { data: tradeValuesData } = useQuery({
    queryKey: ["trade-values", dynasty, ppr],
    queryFn: () => getTradeValues(dynasty, ppr),
  });
  const values = tradeValuesData?.values ?? {};

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
      .filter((p) => {
        if (health === "ALL") return true;
        if (health === "HEALTHY") return !p.injuryStatus;
        return Boolean(p.injuryStatus);
      })
      .filter((p) => (rookiesOnly ? p.yearsExp === 0 : true))
      .filter((p) => (rankedOnly ? Boolean(values[p.playerId]) : true))
      .sort((a, b) => {
        const rankA = values[a.playerId]?.overallRank ?? Infinity;
        const rankB = values[b.playerId]?.overallRank ?? Infinity;
        if (rankA !== rankB) return rankA - rankB;
        return a.name.localeCompare(b.name);
      });
  }, [data, search, position, team, health, rookiesOnly, rankedOnly, values]);

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
        <select value={format} onChange={(e) => setFormat(e.target.value as RankingFormat)}>
          <option value="standard">Standard</option>
          <option value="half">Half PPR</option>
          <option value="full">Full PPR</option>
          <option value="dynasty">Dynasty</option>
        </select>
      </div>

      <div className="filter-bar filter-bar--secondary">
        <select value={health} onChange={(e) => setHealth(e.target.value)}>
          <option value="ALL">Any health status</option>
          <option value="HEALTHY">Healthy only</option>
          <option value="INJURED">Injured / questionable</option>
        </select>
        <label className="filter-toggle">
          <input type="checkbox" checked={rookiesOnly} onChange={(e) => setRookiesOnly(e.target.checked)} />
          Rookies only
        </label>
        <label className="filter-toggle">
          <input type="checkbox" checked={rankedOnly} onChange={(e) => setRankedOnly(e.target.checked)} />
          Ranked only
        </label>
      </div>

      {isLoading && <p>Loading players...</p>}
      {isError && <p className="error-text">{(error as Error).message}</p>}

      {data && (
        <>
          <p className="empty-state">
            {filtered.length} of {data.players.length} players
          </p>
          <PlayersTable players={filtered} values={values} />
        </>
      )}
    </div>
  );
}

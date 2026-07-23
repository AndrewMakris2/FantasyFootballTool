import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPlayers } from "../api/players";
import { getTradeValues } from "../api/tradeValues";
import { PlayersTable } from "../components/PlayersTable";
import { FORMAT_PARAMS, type RankingFormat } from "../lib/rankingFormats";

const POSITIONS = ["QB", "RB", "WR", "TE", "K", "DEF"];

export function Players() {
  const { data, isLoading, isError, error } = useQuery({ queryKey: ["players"], queryFn: getPlayers });

  // Filters live in the URL (not component state) so they survive navigating to a
  // player profile and back with the browser/back-link, instead of resetting.
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") ?? "";
  const position = searchParams.get("pos") ?? "ALL";
  const team = searchParams.get("team") ?? "ALL";
  const format = (searchParams.get("format") as RankingFormat | null) ?? "full";
  const health = searchParams.get("health") ?? "ALL";
  const rookiesOnly = searchParams.get("rookies") === "1";
  const rankedOnly = searchParams.get("ranked") === "1";

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams);
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  }

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
    <div className="page page--bg-players">
      <div className="page-header">
        <h1>Player Database</h1>
      </div>
      <p className="data-source-note">Live player data via Sleeper &middot; trade values via FantasyCalc.</p>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setParam("q", e.target.value)}
        />
        <select value={position} onChange={(e) => setParam("pos", e.target.value === "ALL" ? null : e.target.value)}>
          <option value="ALL">All positions</option>
          {POSITIONS.map((pos) => (
            <option key={pos} value={pos}>
              {pos}
            </option>
          ))}
        </select>
        <select value={team} onChange={(e) => setParam("team", e.target.value === "ALL" ? null : e.target.value)}>
          <option value="ALL">All teams</option>
          {teams.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select value={format} onChange={(e) => setParam("format", e.target.value === "full" ? null : e.target.value)}>
          <option value="standard">Standard</option>
          <option value="half">Half PPR</option>
          <option value="full">Full PPR</option>
          <option value="dynasty">Dynasty</option>
        </select>
      </div>

      <div className="filter-bar filter-bar--secondary">
        <select value={health} onChange={(e) => setParam("health", e.target.value === "ALL" ? null : e.target.value)}>
          <option value="ALL">Any health status</option>
          <option value="HEALTHY">Healthy only</option>
          <option value="INJURED">Injured / questionable</option>
        </select>
        <label className="filter-toggle">
          <input
            type="checkbox"
            checked={rookiesOnly}
            onChange={(e) => setParam("rookies", e.target.checked ? "1" : null)}
          />
          Rookies only
        </label>
        <label className="filter-toggle">
          <input
            type="checkbox"
            checked={rankedOnly}
            onChange={(e) => setParam("ranked", e.target.checked ? "1" : null)}
          />
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

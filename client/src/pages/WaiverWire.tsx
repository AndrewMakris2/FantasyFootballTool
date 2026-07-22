import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTrendingPlayers } from "../api/trendingPlayers";
import { TrendingTable } from "../components/TrendingTable";

type TrendType = "add" | "drop";
const POSITIONS = ["QB", "RB", "WR", "TE", "K", "DEF"];

export function WaiverWire() {
  const [type, setType] = useState<TrendType>("add");
  const [position, setPosition] = useState("ALL");
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["trending-players", type],
    queryFn: () => getTrendingPlayers(type),
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.players.filter((p) => (position === "ALL" ? true : p.position === position));
  }, [data, position]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Waiver Wire</h1>
      </div>

      <div className="filter-bar">
        <select value={type} onChange={(e) => setType(e.target.value as TrendType)}>
          <option value="add">Most Added (24h)</option>
          <option value="drop">Most Dropped (24h)</option>
        </select>
        <select value={position} onChange={(e) => setPosition(e.target.value)}>
          <option value="ALL">All positions</option>
          {POSITIONS.map((pos) => (
            <option key={pos} value={pos}>
              {pos}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p>Loading trends...</p>}
      {isError && <p className="error-text">{(error as Error).message}</p>}

      {data && <TrendingTable players={filtered} />}
    </div>
  );
}

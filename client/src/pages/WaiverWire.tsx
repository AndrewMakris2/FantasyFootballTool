import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTrendingPlayers } from "../api/trendingPlayers";
import { TrendingTable } from "../components/TrendingTable";

type TrendType = "add" | "drop";

export function WaiverWire() {
  const [type, setType] = useState<TrendType>("add");
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["trending-players", type],
    queryFn: () => getTrendingPlayers(type),
  });

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
      </div>

      {isLoading && <p>Loading trends...</p>}
      {isError && <p className="error-text">{(error as Error).message}</p>}

      {data && <TrendingTable players={data.players} />}
    </div>
  );
}

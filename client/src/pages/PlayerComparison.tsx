import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPlayers } from "../api/players";
import { getTradeValues } from "../api/tradeValues";
import { ComparisonTable } from "../components/ComparisonTable";
import { ComparisonModal } from "../components/ComparisonModal";
import { PlayerSearchAdd } from "../components/PlayerSearchAdd";
import { FORMAT_PARAMS, type RankingFormat } from "../lib/rankingFormats";
import type { PlayerProfile } from "../types/player";

const MAX_PLAYERS = 6;

export function PlayerComparison() {
  const { data, isLoading, isError, error } = useQuery({ queryKey: ["players"], queryFn: getPlayers });
  const [format, setFormat] = useState<RankingFormat>("full");
  const [selected, setSelected] = useState<PlayerProfile[]>([]);
  const [showFullComparison, setShowFullComparison] = useState(false);

  const { dynasty, ppr } = FORMAT_PARAMS[format];
  const { data: tradeValuesData } = useQuery({
    queryKey: ["trade-values", dynasty, ppr],
    queryFn: () => getTradeValues(dynasty, ppr),
  });
  const values = tradeValuesData?.values ?? {};

  const candidates = data?.players ?? [];
  const selectedIds = new Set(selected.map((p) => p.playerId));

  return (
    <div className="page page--bg-compare">
      <div className="page-header">
        <h1>Player Comparison</h1>
      </div>

      <div className="filter-bar">
        <select value={format} onChange={(e) => setFormat(e.target.value as RankingFormat)}>
          <option value="standard">Standard</option>
          <option value="half">Half PPR</option>
          <option value="full">Full PPR</option>
          <option value="dynasty">Dynasty</option>
        </select>
        {selected.length > 0 && (
          <button type="button" onClick={() => setShowFullComparison(true)}>
            Full Comparison
          </button>
        )}
      </div>

      {isLoading && <p>Loading players...</p>}
      {isError && <p className="error-text">{(error as Error).message}</p>}

      {data && (
        <>
          {selected.length < MAX_PLAYERS && (
            <PlayerSearchAdd
              candidates={candidates}
              excludeIds={selectedIds}
              onAdd={(p) => setSelected([...selected, p])}
              placeholder={`Search to add a player (up to ${MAX_PLAYERS})...`}
            />
          )}

          <ComparisonTable
            players={selected}
            values={values}
            onRemove={(id) => setSelected(selected.filter((p) => p.playerId !== id))}
          />
        </>
      )}

      {showFullComparison && (
        <ComparisonModal players={selected} values={values} onClose={() => setShowFullComparison(false)} />
      )}
    </div>
  );
}

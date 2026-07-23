import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLeagueDetail, getLeagues } from "../api/leagues";
import { getPlayers } from "../api/players";
import { getTradeValues } from "../api/tradeValues";
import { TradeSide, type TradeCandidate } from "../components/TradeSide";
import { TradeReviewModal } from "../components/TradeReviewModal";
import { generateDraftPickAssets } from "../lib/draftPicks";
import type { Platform } from "../types/league";
import type { TradeValueEntry } from "../types/tradeValue";

type Mode = "freeform" | "league";

export function TradeAnalyzer() {
  const [mode, setMode] = useState<Mode>("freeform");
  const [dynasty, setDynasty] = useState(false);
  const [leagueKey, setLeagueKey] = useState("");
  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");
  const [freeformA, setFreeformA] = useState<TradeCandidate[]>([]);
  const [freeformB, setFreeformB] = useState<TradeCandidate[]>([]);
  const [showReview, setShowReview] = useState(false);

  const { data: playersData } = useQuery({ queryKey: ["players"], queryFn: getPlayers });
  const { data: tradeValuesData } = useQuery({
    queryKey: ["trade-values", dynasty],
    queryFn: () => getTradeValues(dynasty),
  });
  const { data: leaguesData } = useQuery({
    queryKey: ["leagues"],
    queryFn: getLeagues,
    enabled: mode === "league",
  });

  const [platform, leagueId] = leagueKey ? (leagueKey.split(":") as [Platform, string]) : [null, null];
  const { data: leagueDetail } = useQuery({
    queryKey: ["league-detail", platform, leagueId],
    queryFn: () => getLeagueDetail(platform!, leagueId!),
    enabled: mode === "league" && Boolean(platform && leagueId),
  });

  const pickAssets = useMemo(() => generateDraftPickAssets(), []);
  const pickCandidates: TradeCandidate[] = useMemo(
    () => pickAssets.map((asset) => ({ playerId: asset.id, name: asset.label, position: "PICK", team: null })),
    [pickAssets],
  );
  const pickValues = useMemo(() => {
    const map: Record<string, TradeValueEntry> = {};
    for (const asset of pickAssets) {
      map[asset.id] = { sleeperId: asset.id, value: asset.value, overallRank: 0, positionRank: 0, trend30Day: 0 };
    }
    return map;
  }, [pickAssets]);

  const values = { ...(tradeValuesData?.values ?? {}), ...pickValues };
  const candidates: TradeCandidate[] = [...(playersData?.players ?? []), ...pickCandidates];

  const teamA = leagueDetail?.teams.find((t) => t.teamId === teamAId);
  const teamB = leagueDetail?.teams.find((t) => t.teamId === teamBId);

  const [leagueSelectedA, setLeagueSelectedA] = useState<TradeCandidate[]>([]);
  const [leagueSelectedB, setLeagueSelectedB] = useState<TradeCandidate[]>([]);

  const sideA = mode === "league" ? leagueSelectedA : freeformA;
  const sideB = mode === "league" ? leagueSelectedB : freeformB;

  const totalA = useMemo(() => sideA.reduce((sum, p) => sum + (values[p.playerId]?.value ?? 0), 0), [sideA, values]);
  const totalB = useMemo(() => sideB.reduce((sum, p) => sum + (values[p.playerId]?.value ?? 0), 0), [sideB, values]);
  const diff = totalA - totalB;
  const hasTrade = sideA.length > 0 && sideB.length > 0;

  function verdict(): string {
    if (!hasTrade) return "Add players to both sides to see a verdict.";
    const threshold = Math.max(totalA, totalB) * 0.1;
    if (Math.abs(diff) <= threshold) return "Roughly even trade.";
    return diff > 0
      ? `Side A gives up more value (+${diff.toLocaleString()}) — favors Side B.`
      : `Side B gives up more value (+${Math.abs(diff).toLocaleString()}) — favors Side A.`;
  }

  function verdictClass(): string {
    if (!hasTrade) return "trade-verdict--neutral";
    const threshold = Math.max(totalA, totalB) * 0.1;
    return Math.abs(diff) <= threshold ? "trade-verdict--even" : "trade-verdict--lopsided";
  }

  return (
    <div className="page page--bg-trade">
      <div className="page-header">
        <h1>Trade Analyzer</h1>
      </div>

      <div className="filter-bar">
        <select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
          <option value="freeform">Any players</option>
          <option value="league">From a league</option>
        </select>
        <select value={dynasty ? "dynasty" : "redraft"} onChange={(e) => setDynasty(e.target.value === "dynasty")}>
          <option value="redraft">Redraft value</option>
          <option value="dynasty">Dynasty value</option>
        </select>
      </div>

      {mode === "league" && (
        <div className="filter-bar">
          <select
            value={leagueKey}
            onChange={(e) => {
              setLeagueKey(e.target.value);
              setTeamAId("");
              setTeamBId("");
              setLeagueSelectedA([]);
              setLeagueSelectedB([]);
            }}
          >
            <option value="">Select a league...</option>
            {leaguesData?.leagues.map((l) => (
              <option key={`${l.platform}:${l.leagueId}`} value={`${l.platform}:${l.leagueId}`}>
                {l.name} ({l.platform})
              </option>
            ))}
          </select>
          {leagueDetail && (
            <>
              <select value={teamAId} onChange={(e) => setTeamAId(e.target.value)}>
                <option value="">Team A...</option>
                {leagueDetail.teams.map((t) => (
                  <option key={t.teamId} value={t.teamId}>
                    {t.teamName}
                  </option>
                ))}
              </select>
              <select value={teamBId} onChange={(e) => setTeamBId(e.target.value)}>
                <option value="">Team B...</option>
                {leagueDetail.teams.map((t) => (
                  <option key={t.teamId} value={t.teamId}>
                    {t.teamName}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      )}

      <div className="trade-grid">
        <TradeSide
          label="Side A gives"
          candidates={mode === "league" ? teamA?.roster ?? [] : candidates}
          selected={sideA}
          values={values}
          onAdd={(p) => (mode === "league" ? setLeagueSelectedA([...leagueSelectedA, p]) : setFreeformA([...freeformA, p]))}
          onRemove={(id) =>
            mode === "league"
              ? setLeagueSelectedA(leagueSelectedA.filter((p) => p.playerId !== id))
              : setFreeformA(freeformA.filter((p) => p.playerId !== id))
          }
        />
        <div className="trade-vs">VS</div>
        <TradeSide
          label="Side B gives"
          candidates={mode === "league" ? teamB?.roster ?? [] : candidates}
          selected={sideB}
          values={values}
          onAdd={(p) => (mode === "league" ? setLeagueSelectedB([...leagueSelectedB, p]) : setFreeformB([...freeformB, p]))}
          onRemove={(id) =>
            mode === "league"
              ? setLeagueSelectedB(leagueSelectedB.filter((p) => p.playerId !== id))
              : setFreeformB(freeformB.filter((p) => p.playerId !== id))
          }
        />
      </div>

      <div className={`trade-verdict ${verdictClass()}`}>{verdict()}</div>

      {hasTrade && (
        <div className="trade-review-trigger">
          <button type="button" onClick={() => setShowReview(true)}>
            Review Trade
          </button>
        </div>
      )}

      {showReview && (
        <TradeReviewModal
          sideA={sideA}
          sideB={sideB}
          values={values}
          verdict={verdict()}
          onClose={() => setShowReview(false)}
        />
      )}
    </div>
  );
}

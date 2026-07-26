import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPlayers } from "../api/players";
import { getCustomRankingSets, saveCustomRankingSet, deleteCustomRankingSet } from "../api/customRankings";
import { parseRankingList, buildValueEntries, type ParseRankingResult } from "../lib/parseRankingImport";
import { PlayerSearchAdd } from "../components/PlayerSearchAdd";
import { PlayerAvatar } from "../components/PlayerAvatar";
import { PositionBadge } from "../components/PositionBadge";
import { TeamTag } from "../components/TeamTag";
import { medalClass } from "../lib/medal";
import type { PlayerProfile } from "../types/player";

interface ResolvedEntry {
  lineIndex: number;
  player: PlayerProfile;
}

const POSITION_FILTERS = ["ALL", "QB", "RB", "WR", "TE", "K", "DEF"];

export function ImportRankings() {
  const queryClient = useQueryClient();
  const { data: playersData } = useQuery({ queryKey: ["players"], queryFn: getPlayers });
  const { data: customSetsData } = useQuery({ queryKey: ["custom-rankings"], queryFn: getCustomRankingSets });
  const players = useMemo(() => playersData?.players ?? [], [playersData]);
  const playersById = useMemo(() => new Map(players.map((p) => [p.playerId, p])), [players]);

  const [name, setName] = useState("");
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<ParseRankingResult | null>(null);
  const [resolved, setResolved] = useState<Map<number, ResolvedEntry>>(new Map());
  const [skipped, setSkipped] = useState<Set<number>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [viewingSetName, setViewingSetName] = useState<string | null>(null);
  const [positionFilter, setPositionFilter] = useState("ALL");

  function handlePreview() {
    if (players.length === 0) return;
    setParsed(parseRankingList(rawText, players));
    setResolved(new Map());
    setSkipped(new Set());
    setSaveSuccess(false);
    setSaveError(null);
  }

  function resolveLine(lineIndex: number, player: PlayerProfile) {
    setResolved((prev) => new Map(prev).set(lineIndex, { lineIndex, player }));
  }

  function skipLine(lineIndex: number) {
    setSkipped((prev) => new Set(prev).add(lineIndex));
  }

  const finalMatches = useMemo(() => {
    if (!parsed) return [];
    const all: ResolvedEntry[] = [
      ...parsed.matched.map((m) => ({ lineIndex: m.lineIndex, player: m.player })),
      ...Array.from(resolved.values()),
    ];
    return all.filter((entry) => !skipped.has(entry.lineIndex)).sort((a, b) => a.lineIndex - b.lineIndex);
  }, [parsed, resolved, skipped]);

  const pendingAmbiguous = (parsed?.ambiguous ?? []).filter(
    (line) => !resolved.has(line.lineIndex) && !skipped.has(line.lineIndex),
  );
  const pendingUnmatched = (parsed?.unmatched ?? []).filter(
    (line) => !resolved.has(line.lineIndex) && !skipped.has(line.lineIndex),
  );
  const matchedIds = new Set(finalMatches.map((m) => m.player.playerId));

  async function handleSave() {
    if (!name.trim() || finalMatches.length === 0) return;
    setSaveError(null);
    try {
      await saveCustomRankingSet(name.trim(), buildValueEntries(finalMatches));
      await queryClient.invalidateQueries({ queryKey: ["custom-rankings"] });
      setSaveSuccess(true);
    } catch (err) {
      setSaveError((err as Error).message);
    }
  }

  async function handleDelete(setName: string) {
    await deleteCustomRankingSet(setName);
    if (viewingSetName === setName) setViewingSetName(null);
    await queryClient.invalidateQueries({ queryKey: ["custom-rankings"] });
  }

  const viewingSet = viewingSetName ? customSetsData?.sets[viewingSetName] : undefined;

  const viewingRows = useMemo(() => {
    if (!viewingSet) return [];
    const rows = Object.entries(viewingSet.entries)
      .map(([playerId, entry]) => ({ entry, player: playersById.get(playerId) }))
      .filter((row): row is { entry: (typeof row)["entry"]; player: PlayerProfile } => !!row.player)
      .sort((a, b) => a.entry.overallRank - b.entry.overallRank);
    return positionFilter === "ALL" ? rows : rows.filter((row) => row.player.position === positionFilter);
  }, [viewingSet, playersById, positionFilter]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Import Rankings</h1>
      </div>
      <p className="empty-state">
        Paste a ranked player list from any site or expert — one player per line, in rank order. We'll
        match each line to a player in our database so you can draft off of it in Mock Draft. This is a
        manual, one-time import — paste a fresh list whenever you want to refresh it.
      </p>

      <div className="import-rankings__form">
        <label>
          <span className="import-rankings__step">1</span> Ranking set name
          <input
            type="text"
            placeholder="e.g. Expert Redraft Big Board"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          <span className="import-rankings__step">2</span> Paste your list
          <textarea
            rows={12}
            placeholder={"1. Ja'Marr Chase WR CIN\n2. Bijan Robinson RB ATL\n3. ..."}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
        </label>
        <button type="button" onClick={handlePreview} disabled={rawText.trim().length === 0}>
          Preview
        </button>
      </div>

      {parsed && (
        <div className="import-rankings__review">
          <h2>Review</h2>
          <p className="empty-state">
            {finalMatches.length} matched &middot; {pendingAmbiguous.length} need disambiguation &middot;{" "}
            {pendingUnmatched.length} unmatched
          </p>

          {pendingAmbiguous.length > 0 && (
            <div className="import-rankings__section">
              <h3>Multiple matches — pick the right player</h3>
              {pendingAmbiguous.map((line) => (
                <div key={line.lineIndex} className="import-rankings__line">
                  <span className="import-rankings__line-text">{line.line}</span>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const player = line.candidates.find((c) => c.playerId === e.target.value);
                      if (player) resolveLine(line.lineIndex, player);
                    }}
                  >
                    <option value="" disabled>
                      Choose player...
                    </option>
                    {line.candidates.map((c) => (
                      <option key={c.playerId} value={c.playerId}>
                        {c.name} ({c.position} - {c.team})
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => skipLine(line.lineIndex)}>
                    Skip
                  </button>
                </div>
              ))}
            </div>
          )}

          {pendingUnmatched.length > 0 && (
            <div className="import-rankings__section">
              <h3>No match — search to assign</h3>
              {pendingUnmatched.map((line) => (
                <div key={line.lineIndex} className="import-rankings__line">
                  <span className="import-rankings__line-text">{line.line}</span>
                  <div className="import-rankings__search">
                    <PlayerSearchAdd
                      candidates={players}
                      excludeIds={matchedIds}
                      onAdd={(player) => resolveLine(line.lineIndex, player)}
                      placeholder="Search players..."
                    />
                  </div>
                  <button type="button" onClick={() => skipLine(line.lineIndex)}>
                    Skip
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="import-rankings__save">
            <button type="button" onClick={handleSave} disabled={!name.trim() || finalMatches.length === 0}>
              Save Ranking Set
            </button>
            {saveError && <p className="error-text">{saveError}</p>}
            {saveSuccess && (
              <p className="success-text">Saved. Select "{name}" as a scoring format next time you set up a Mock Draft.</p>
            )}
          </div>
        </div>
      )}

      {customSetsData && Object.keys(customSetsData.sets).length > 0 && (
        <div className="import-rankings__saved">
          <h2>Saved Ranking Sets</h2>
          <div className="ranking-set-grid">
            {Object.values(customSetsData.sets).map((set) => {
              const entries = Object.entries(set.entries);
              const positionCounts: Record<string, number> = {};
              for (const [playerId] of entries) {
                const pos = playersById.get(playerId)?.position ?? "UNK";
                positionCounts[pos] = (positionCounts[pos] ?? 0) + 1;
              }
              return (
                <button
                  key={set.name}
                  type="button"
                  className={`ranking-set-card ${viewingSetName === set.name ? "ranking-set-card--active" : ""}`}
                  onClick={() => setViewingSetName(viewingSetName === set.name ? null : set.name)}
                >
                  <span className="ranking-set-card__name">{set.name}</span>
                  <span className="ranking-set-card__count">{entries.length} players</span>
                  <div className="ranking-set-card__bar">
                    {Object.entries(positionCounts).map(([pos, count]) => (
                      <span
                        key={pos}
                        className={`ranking-set-card__bar-segment ranking-set-card__bar-segment--${pos}`}
                        style={{ width: `${(count / entries.length) * 100}%` }}
                        title={`${pos}: ${count}`}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {viewingSet && (
            <div className="ranking-set-viewer">
              <div className="ranking-set-viewer__header">
                <h3>{viewingSetName}</h3>
                <div className="ranking-set-viewer__actions">
                  <div className="ranking-set-viewer__filters">
                    {POSITION_FILTERS.map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        className={`ranking-set-filter-chip ${positionFilter === pos ? "ranking-set-filter-chip--active" : ""}`}
                        onClick={() => setPositionFilter(pos)}
                      >
                        {pos === "ALL" ? "All" : pos}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="ranking-set-viewer__delete"
                    onClick={() => handleDelete(viewingSetName!)}
                  >
                    Delete Set
                  </button>
                </div>
              </div>

              <div className="ranking-set-list">
                {viewingRows.length === 0 && <p className="empty-state">No players at this position.</p>}
                {viewingRows.map(({ entry, player }) => (
                  <Link key={player.playerId} to={`/players/${player.playerId}`} className="ranking-set-row">
                    <span className={`ranking-set-row__rank ${medalClass(entry.overallRank)}`}>
                      #{entry.overallRank}
                    </span>
                    <PlayerAvatar
                      playerId={player.playerId}
                      name={player.name}
                      position={player.position}
                      team={player.team}
                      size="sm"
                    />
                    <span className="ranking-set-row__name">{player.name}</span>
                    <PositionBadge position={player.position} />
                    <TeamTag team={player.team} />
                    <span className="ranking-set-row__pos-rank">Pos #{entry.positionRank}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPlayers } from "../api/players";
import { getCustomRankingSets, saveCustomRankingSet, deleteCustomRankingSet } from "../api/customRankings";
import { parseRankingList, buildValueEntries, type ParseRankingResult } from "../lib/parseRankingImport";
import { PlayerSearchAdd } from "../components/PlayerSearchAdd";
import { FootballIcon } from "../components/FootballIcon";
import type { PlayerProfile } from "../types/player";

interface ResolvedEntry {
  lineIndex: number;
  player: PlayerProfile;
}

export function ImportRankings() {
  const queryClient = useQueryClient();
  const { data: playersData } = useQuery({ queryKey: ["players"], queryFn: getPlayers });
  const { data: customSetsData } = useQuery({ queryKey: ["custom-rankings"], queryFn: getCustomRankingSets });
  const players = useMemo(() => playersData?.players ?? [], [playersData]);

  const [name, setName] = useState("");
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<ParseRankingResult | null>(null);
  const [resolved, setResolved] = useState<Map<number, ResolvedEntry>>(new Map());
  const [skipped, setSkipped] = useState<Set<number>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
    await queryClient.invalidateQueries({ queryKey: ["custom-rankings"] });
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Import Rankings</h1>
        <FootballIcon className="page-header__decoration" />
      </div>
      <p className="empty-state">
        Paste a ranked player list from any site or expert — one player per line, in rank order. We'll
        match each line to a player in our database so you can draft off of it in Mock Draft.
      </p>

      <div className="import-rankings__form">
        <label>
          Ranking set name
          <input
            type="text"
            placeholder="e.g. Expert Redraft Big Board"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Paste your list
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
          <ul>
            {Object.values(customSetsData.sets).map((set) => (
              <li key={set.name}>
                <span>{set.name}</span>
                <span className="empty-state">{Object.keys(set.entries).length} players</span>
                <button type="button" onClick={() => handleDelete(set.name)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

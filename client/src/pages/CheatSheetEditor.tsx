import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPlayers } from "../api/players";
import { getTradeValues } from "../api/tradeValues";
import { getCheatSheets, saveCheatSheet } from "../api/cheatSheets";
import type { CheatSheet, CheatSheetPlayerEntry } from "../types/cheatSheet";
import { FORMAT_PARAMS, type RankingFormat } from "../lib/rankingFormats";
import { PlayerAvatar } from "../components/PlayerAvatar";
import { PositionBadge } from "../components/PositionBadge";
import { TeamTag } from "../components/TeamTag";
import { PlayerSearchAdd } from "../components/PlayerSearchAdd";

function emptySheet(id: string): CheatSheet {
  return {
    id,
    name: "",
    scoringFormat: "full",
    numTeams: 12,
    notes: "",
    players: [],
    updatedAt: Date.now(),
  };
}

export function CheatSheetEditor() {
  const { id: routeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [sheetId] = useState(() => (routeId === "new" ? crypto.randomUUID() : routeId!));
  useEffect(() => {
    if (routeId === "new") {
      navigate(`/cheat-sheets/${sheetId}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: sheetsData, isLoading: sheetsLoading } = useQuery({
    queryKey: ["cheat-sheets"],
    queryFn: getCheatSheets,
  });
  const { data: playersData } = useQuery({ queryKey: ["players"], queryFn: getPlayers });

  const [sheet, setSheet] = useState<CheatSheet | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current || sheetsLoading) return;
    setSheet(sheetsData?.sheets[sheetId] ?? emptySheet(sheetId));
    initializedRef.current = true;
  }, [sheetsLoading, sheetsData, sheetId]);

  // Auto-save, debounced — this is meant to be a live draft-day tool, so every
  // edit (adding a player, checking off "drafted", jotting a note) should persist
  // without the user having to remember to hit a save button.
  useEffect(() => {
    if (!sheet) return;
    const timeout = setTimeout(() => {
      saveCheatSheet(sheet)
        .then(() => {
          setSaveError(null);
          return queryClient.invalidateQueries({ queryKey: ["cheat-sheets"] });
        })
        .catch((err) => setSaveError((err as Error).message));
    }, 600);
    return () => clearTimeout(timeout);
  }, [sheet, queryClient]);

  const format = sheet?.scoringFormat ?? "full";
  const { dynasty, ppr } = FORMAT_PARAMS[format];
  const { data: tradeValuesData } = useQuery({
    queryKey: ["trade-values", dynasty, ppr],
    queryFn: () => getTradeValues(dynasty, ppr),
    enabled: !!sheet,
  });

  if (!sheet || !playersData) {
    return (
      <div className="page">
        <p>Loading cheat sheet...</p>
      </div>
    );
  }

  const playersById = new Map(playersData.players.map((p) => [p.playerId, p]));
  const excludeIds = new Set(sheet.players.map((p) => p.playerId));

  function updateSheet(patch: Partial<CheatSheet>) {
    setSheet((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function updatePlayerEntry(playerId: string, patch: Partial<CheatSheetPlayerEntry>) {
    updateSheet({
      players: sheet!.players.map((p) => (p.playerId === playerId ? { ...p, ...patch } : p)),
    });
  }

  function addPlayer(playerId: string) {
    updateSheet({ players: [...sheet!.players, { playerId, round: null, note: "", drafted: false }] });
  }

  function removePlayer(playerId: string) {
    updateSheet({ players: sheet!.players.filter((p) => p.playerId !== playerId) });
  }

  const sortedPlayers = [...sheet.players].sort((a, b) => {
    const roundA = a.round ?? Infinity;
    const roundB = b.round ?? Infinity;
    if (roundA !== roundB) return roundA - roundB;
    const rankA = tradeValuesData?.values[a.playerId]?.overallRank ?? Infinity;
    const rankB = tradeValuesData?.values[b.playerId]?.overallRank ?? Infinity;
    return rankA - rankB;
  });

  return (
    <div className="page page--wide">
      <Link to="/cheat-sheets" className="back-link">
        &larr; All cheat sheets
      </Link>

      <div className="page-header">
        <input
          type="text"
          className="cheat-sheet-editor__name"
          placeholder="Cheat sheet name (e.g. The Sopranos — 2024 Draft)"
          value={sheet.name}
          onChange={(e) => updateSheet({ name: e.target.value })}
        />
      </div>

      {saveError && <p className="error-text">Couldn't save: {saveError}</p>}

      <div className="filter-bar">
        <select
          value={sheet.scoringFormat}
          onChange={(e) => updateSheet({ scoringFormat: e.target.value as RankingFormat })}
        >
          <option value="standard">Standard</option>
          <option value="half">Half PPR</option>
          <option value="full">Full PPR</option>
          <option value="dynasty">Dynasty</option>
        </select>
        <label className="cheat-sheet-editor__teams-field">
          <input
            type="number"
            min={4}
            max={20}
            value={sheet.numTeams}
            onChange={(e) => updateSheet({ numTeams: Number(e.target.value) || sheet.numTeams })}
          />
          teams
        </label>
      </div>

      <textarea
        className="cheat-sheet-editor__notes"
        rows={3}
        placeholder="General draft notes — strategy, sleepers, players to avoid..."
        value={sheet.notes}
        onChange={(e) => updateSheet({ notes: e.target.value })}
      />

      <h2>Add Players</h2>
      <PlayerSearchAdd candidates={playersData.players} excludeIds={excludeIds} onAdd={(p) => addPlayer(p.playerId)} />

      <h2>Draft Board</h2>
      {sortedPlayers.length === 0 ? (
        <p className="empty-state">Search above to add players to your cheat sheet.</p>
      ) : (
        <div className="cheat-sheet-list">
          {sortedPlayers.map((entry) => {
            const player = playersById.get(entry.playerId);
            if (!player) return null;
            const value = tradeValuesData?.values[entry.playerId];
            return (
              <div
                key={entry.playerId}
                className={`cheat-sheet-row ${entry.drafted ? "cheat-sheet-row--drafted" : ""}`}
              >
                <input
                  type="number"
                  className="cheat-sheet-row__round"
                  placeholder="Rd"
                  min={1}
                  value={entry.round ?? ""}
                  onChange={(e) =>
                    updatePlayerEntry(entry.playerId, {
                      round: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
                <PlayerAvatar
                  playerId={player.playerId}
                  name={player.name}
                  position={player.position}
                  team={player.team}
                  size="sm"
                />
                <Link to={`/players/${player.playerId}`} className="cheat-sheet-row__name">
                  {player.name}
                </Link>
                <PositionBadge position={player.position} />
                <TeamTag team={player.team} />
                <span className="cheat-sheet-row__rank">{value ? `#${value.overallRank}` : "—"}</span>
                <input
                  type="text"
                  className="cheat-sheet-row__note"
                  placeholder="Note..."
                  value={entry.note}
                  onChange={(e) => updatePlayerEntry(entry.playerId, { note: e.target.value })}
                />
                <label className="cheat-sheet-row__drafted-toggle">
                  <input
                    type="checkbox"
                    checked={entry.drafted}
                    onChange={(e) => updatePlayerEntry(entry.playerId, { drafted: e.target.checked })}
                  />
                  Drafted
                </label>
                <button type="button" className="trade-side__remove" onClick={() => removePlayer(entry.playerId)}>
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

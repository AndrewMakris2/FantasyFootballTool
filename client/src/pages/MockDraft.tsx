import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPlayers } from "../api/players";
import { getTradeValues } from "../api/tradeValues";
import { FORMAT_PARAMS } from "../lib/rankingFormats";
import { buildPickOrder, chooseBestPick, slotForManualPick, totalRounds } from "../lib/mockDraftEngine";
import { DraftSettingsForm } from "../components/DraftSettingsForm";
import { DraftLog } from "../components/DraftLog";
import { DraftRosterPanel } from "../components/DraftRosterPanel";
import { PlayerSearchAdd } from "../components/PlayerSearchAdd";
import type { DraftPick, DraftSettings } from "../types/draft";

const BOT_PICK_DELAY_MS = 500;

export function MockDraft() {
  const [settings, setSettings] = useState<DraftSettings | null>(null);
  const [picks, setPicks] = useState<DraftPick[]>([]);

  const { data: playersData } = useQuery({
    queryKey: ["players"],
    queryFn: getPlayers,
    enabled: settings !== null,
  });

  const formatParams = settings ? FORMAT_PARAMS[settings.format] : null;
  const { data: valuesData } = useQuery({
    queryKey: ["trade-values", formatParams?.dynasty, formatParams?.ppr],
    queryFn: () => getTradeValues(formatParams!.dynasty, formatParams!.ppr),
    enabled: settings !== null && formatParams !== null,
  });

  const players = playersData?.players ?? [];
  const values = valuesData?.values ?? {};
  const playersById = useMemo(() => new Map(players.map((p) => [p.playerId, p])), [players]);

  const pickOrder = useMemo(() => {
    if (!settings) return [];
    return buildPickOrder(settings.numTeams, totalRounds(settings.rosterSlots));
  }, [settings]);

  const draftedIds = useMemo(() => new Set(picks.map((p) => p.playerId)), [picks]);
  const availablePlayers = useMemo(() => players.filter((p) => !draftedIds.has(p.playerId)), [players, draftedIds]);

  const currentPickIndex = picks.length;
  const currentPick = pickOrder[currentPickIndex];
  const draftLoaded = settings !== null && players.length > 0 && Object.keys(values).length > 0;
  const draftComplete = settings !== null && currentPickIndex >= pickOrder.length && pickOrder.length > 0;
  const isBotTurn = draftLoaded && currentPick && currentPick.teamIndex !== settings!.userTeamIndex;

  function makePick(playerId: string) {
    if (!settings || !currentPick) return;
    const player = playersById.get(playerId);
    if (!player) return;
    const teamPicks = picks.filter((p) => p.teamIndex === currentPick.teamIndex);
    const slot = slotForManualPick(player, teamPicks, settings.rosterSlots);
    setPicks([...picks, { ...currentPick, playerId, slot }]);
  }

  useEffect(() => {
    if (!isBotTurn || !settings) return;
    const teamPicks = picks.filter((p) => p.teamIndex === currentPick.teamIndex);
    const timer = setTimeout(() => {
      const result = chooseBestPick(availablePlayers, teamPicks, settings.rosterSlots, values);
      if (result) makePick(result.player.playerId);
    }, BOT_PICK_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBotTurn, currentPickIndex]);

  function teamLabel(teamIndex: number): string {
    if (settings && teamIndex === settings.userTeamIndex) return "You";
    return `Team ${teamIndex + 1}`;
  }

  if (!settings) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Mock Draft</h1>
        </div>
        <DraftSettingsForm onStart={setSettings} />
      </div>
    );
  }

  if (!draftLoaded) {
    return (
      <div className="page">
        <p>Loading player pool...</p>
      </div>
    );
  }

  if (draftComplete) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Draft Complete</h1>
          <button type="button" onClick={() => { setSettings(null); setPicks([]); }}>
            New Draft
          </button>
        </div>
        <div className="draft-summary-grid">
          {Array.from({ length: settings.numTeams }, (_, teamIndex) => (
            <div key={teamIndex} className="draft-summary-team">
              <h2>{teamLabel(teamIndex)}</h2>
              <DraftRosterPanel
                picks={picks.filter((p) => p.teamIndex === teamIndex)}
                rosterSlots={settings.rosterSlots}
                playersById={playersById}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const userTeamPicks = picks.filter((p) => p.teamIndex === settings.userTeamIndex);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Mock Draft</h1>
        <button type="button" onClick={() => { setSettings(null); setPicks([]); }}>
          Restart
        </button>
      </div>

      <div className={`draft-clock ${isBotTurn ? "draft-clock--bot" : "draft-clock--user"}`}>
        Pick {currentPick.round}.{String(currentPick.overallPick).padStart(3, "0")} — on the clock:{" "}
        <strong>{teamLabel(currentPick.teamIndex)}</strong>
      </div>

      <div className="draft-layout">
        <div>
          <h2>Your Roster</h2>
          <DraftRosterPanel picks={userTeamPicks} rosterSlots={settings.rosterSlots} playersById={playersById} />

          {!isBotTurn && (
            <div className="draft-pick-controls">
              <PlayerSearchAdd
                candidates={availablePlayers}
                excludeIds={draftedIds}
                onAdd={(p) => makePick(p.playerId)}
                placeholder="Search to draft a player..."
              />
              <button
                type="button"
                onClick={() => {
                  const result = chooseBestPick(availablePlayers, userTeamPicks, settings.rosterSlots, values);
                  if (result) makePick(result.player.playerId);
                }}
              >
                Draft Best Available
              </button>
            </div>
          )}
        </div>

        <div>
          <h2>Draft Log</h2>
          <DraftLog picks={picks} playersById={playersById} teamLabel={teamLabel} />
        </div>
      </div>
    </div>
  );
}

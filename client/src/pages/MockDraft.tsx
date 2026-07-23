import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPlayers } from "../api/players";
import { getTradeValues } from "../api/tradeValues";
import { getCustomRankingSets } from "../api/customRankings";
import { FORMAT_PARAMS } from "../lib/rankingFormats";
import { buildPickOrder, chooseBestPick, slotForManualPick, totalRounds } from "../lib/mockDraftEngine";
import { DraftSettingsForm } from "../components/DraftSettingsForm";
import { DraftBoardGrid } from "../components/DraftBoardGrid";
import { DraftRosterPanel } from "../components/DraftRosterPanel";
import { AvailablePlayersPanel } from "../components/AvailablePlayersPanel";
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

  const valueSource = settings?.valueSource;
  const formatParams = valueSource?.kind === "builtin" ? FORMAT_PARAMS[valueSource.format] : null;
  const { data: valuesData } = useQuery({
    queryKey: ["trade-values", formatParams?.dynasty, formatParams?.ppr],
    queryFn: () => getTradeValues(formatParams!.dynasty, formatParams!.ppr),
    enabled: settings !== null && formatParams !== null,
  });
  const { data: customSetsData } = useQuery({
    queryKey: ["custom-rankings"],
    queryFn: getCustomRankingSets,
    enabled: settings !== null && valueSource?.kind === "custom",
  });

  const players = playersData?.players ?? [];
  const values = useMemo(() => {
    if (valueSource?.kind === "custom") return customSetsData?.sets[valueSource.name]?.entries ?? {};
    return valuesData?.values ?? {};
  }, [valueSource, customSetsData, valuesData]);
  const playersById = useMemo(() => new Map(players.map((p) => [p.playerId, p])), [players]);

  const rounds = settings ? totalRounds(settings.rosterSlots) : 0;
  const pickOrder = useMemo(() => {
    if (!settings) return [];
    return buildPickOrder(settings.numTeams, rounds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const result = chooseBestPick(
        availablePlayers,
        teamPicks,
        settings.rosterSlots,
        values,
        currentPick.round,
        playersById,
      );
      if (result) makePick(result.player.playerId);
    }, BOT_PICK_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBotTurn, currentPickIndex]);

  function teamLabel(teamIndex: number): string {
    if (settings && teamIndex === settings.userTeamIndex) return "You";
    return `Team ${teamIndex + 1}`;
  }

  function restart() {
    setSettings(null);
    setPicks([]);
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
          <button type="button" onClick={restart}>
            New Draft
          </button>
        </div>
        <DraftBoardGrid
          numTeams={settings.numTeams}
          rounds={rounds}
          picks={picks}
          currentPick={undefined}
          playersById={playersById}
          teamLabel={teamLabel}
        />
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
        <button type="button" onClick={restart}>
          Restart
        </button>
      </div>

      <div className={`draft-clock ${isBotTurn ? "draft-clock--bot" : "draft-clock--user"}`}>
        Pick {currentPick.round}.{String(currentPick.overallPick).padStart(3, "0")} — on the clock:{" "}
        <strong>{teamLabel(currentPick.teamIndex)}</strong>
      </div>

      <DraftBoardGrid
        numTeams={settings.numTeams}
        rounds={rounds}
        picks={picks}
        currentPick={currentPick}
        playersById={playersById}
        teamLabel={teamLabel}
      />

      <div className="draft-layout">
        <div>
          <h2>Your Roster</h2>
          <DraftRosterPanel picks={userTeamPicks} rosterSlots={settings.rosterSlots} playersById={playersById} />
          {!isBotTurn && (
            <div className="draft-pick-controls">
              <button
                type="button"
                onClick={() => {
                  const result = chooseBestPick(
                    availablePlayers,
                    userTeamPicks,
                    settings.rosterSlots,
                    values,
                    currentPick.round,
                    playersById,
                  );
                  if (result) makePick(result.player.playerId);
                }}
              >
                Draft Best Available
              </button>
            </div>
          )}
        </div>

        <div>
          <h2>Available Players</h2>
          <AvailablePlayersPanel
            players={availablePlayers}
            values={values}
            onDraft={makePick}
            canDraft={!isBotTurn}
          />
        </div>
      </div>
    </div>
  );
}

import type { DraftPick, PickSlot, RosterSlotKey, RosterSlots } from "../types/draft";
import type { PlayerProfile } from "../types/player";
import type { TradeValueEntry } from "../types/tradeValue";

export const SLOT_PRIORITY: RosterSlotKey[] = ["QB", "RB", "WR", "TE", "FLEX", "K", "DEF"];

export const SLOT_POSITIONS: Record<RosterSlotKey, string[]> = {
  QB: ["QB"],
  RB: ["RB"],
  WR: ["WR"],
  TE: ["TE"],
  FLEX: ["RB", "WR", "TE"],
  K: ["K"],
  DEF: ["DEF"],
  BENCH: [],
};

export function defaultRosterSlots(): RosterSlots {
  return { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DEF: 1, BENCH: 6 };
}

export function totalRounds(slots: RosterSlots): number {
  return Object.values(slots).reduce((sum, n) => sum + n, 0);
}

export function buildPickOrder(numTeams: number, rounds: number): PickSlot[] {
  const picks: PickSlot[] = [];
  let overallPick = 1;
  for (let round = 0; round < rounds; round++) {
    const teamIndices = Array.from({ length: numTeams }, (_, i) => i);
    const order = round % 2 === 0 ? teamIndices : teamIndices.reverse();
    for (const teamIndex of order) {
      picks.push({ overallPick: overallPick++, round: round + 1, teamIndex });
    }
  }
  return picks;
}

function countFilledSlots(teamPicks: DraftPick[]): Record<RosterSlotKey, number> {
  const counts: Record<RosterSlotKey, number> = {
    QB: 0,
    RB: 0,
    WR: 0,
    TE: 0,
    FLEX: 0,
    K: 0,
    DEF: 0,
    BENCH: 0,
  };
  for (const pick of teamPicks) counts[pick.slot]++;
  return counts;
}

/**
 * Best-player-for-need: fills starter slots in priority order, falls back to
 * best overall available for BENCH. Used for both bot auto-picks and the
 * user's "best available" shortcut.
 */
export function chooseBestPick(
  availablePlayers: PlayerProfile[],
  teamPicks: DraftPick[],
  rosterSlots: RosterSlots,
  values: Record<string, TradeValueEntry>,
): { player: PlayerProfile; slot: RosterSlotKey } | null {
  const filled = countFilledSlots(teamPicks);
  const rankOf = (p: PlayerProfile) => values[p.playerId]?.overallRank ?? Infinity;
  const best = (players: PlayerProfile[]) => players.reduce((a, b) => (rankOf(a) <= rankOf(b) ? a : b));

  for (const slot of SLOT_PRIORITY) {
    if (filled[slot] >= rosterSlots[slot]) continue;
    const eligible = availablePlayers.filter((p) => SLOT_POSITIONS[slot].includes(p.position));
    if (eligible.length === 0) continue;
    return { player: best(eligible), slot };
  }

  if (filled.BENCH < rosterSlots.BENCH && availablePlayers.length > 0) {
    return { player: best(availablePlayers), slot: "BENCH" };
  }

  return null;
}

/** Which roster slot a manually-picked player should be slotted into (first open slot they're eligible for). */
export function slotForManualPick(
  player: PlayerProfile,
  teamPicks: DraftPick[],
  rosterSlots: RosterSlots,
): RosterSlotKey {
  const filled = countFilledSlots(teamPicks);
  for (const slot of SLOT_PRIORITY) {
    if (filled[slot] < rosterSlots[slot] && SLOT_POSITIONS[slot].includes(player.position)) {
      return slot;
    }
  }
  return "BENCH";
}

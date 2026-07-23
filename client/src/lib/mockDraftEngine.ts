import type { DraftPick, PickSlot, RosterSlotKey, RosterSlots } from "../types/draft";
import type { PlayerProfile } from "../types/player";
import type { TradeValueEntry } from "../types/tradeValue";
import { byeWeekFor } from "./byeWeeks";

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

function rankOf(player: PlayerProfile, values: Record<string, TradeValueEntry>): number {
  return values[player.playerId]?.overallRank ?? Infinity;
}

function bestByRank(players: PlayerProfile[], values: Record<string, TradeValueEntry>): PlayerProfile {
  return players.reduce((a, b) => (rankOf(a, values) <= rankOf(b, values) ? a : b));
}

/** First open roster slot (starter first, then bench) a player is eligible for. */
function slotFor(
  player: PlayerProfile,
  filled: Record<RosterSlotKey, number>,
  rosterSlots: RosterSlots,
): RosterSlotKey {
  for (const slot of SLOT_PRIORITY) {
    if (filled[slot] < rosterSlots[slot] && SLOT_POSITIONS[slot].includes(player.position)) {
      return slot;
    }
  }
  return "BENCH";
}

function hasOpenSlot(player: PlayerProfile, filled: Record<RosterSlotKey, number>, rosterSlots: RosterSlots): boolean {
  for (const slot of SLOT_PRIORITY) {
    if (SLOT_POSITIONS[slot].includes(player.position) && filled[slot] < rosterSlots[slot]) return true;
  }
  return filled.BENCH < rosterSlots.BENCH;
}

function isKickerOrDefense(player: PlayerProfile): boolean {
  return player.position === "K" || player.position === "DEF";
}

/** Strict need-based pick: fills the highest-priority open starter slot, falls back to bench BPA. */
function pickForNeed(
  availablePlayers: PlayerProfile[],
  filled: Record<RosterSlotKey, number>,
  rosterSlots: RosterSlots,
  values: Record<string, TradeValueEntry>,
): { player: PlayerProfile; slot: RosterSlotKey } | null {
  for (const slot of SLOT_PRIORITY) {
    if (filled[slot] >= rosterSlots[slot]) continue;
    const eligible = availablePlayers.filter((p) => SLOT_POSITIONS[slot].includes(p.position));
    if (eligible.length === 0) continue;
    return { player: bestByRank(eligible, values), slot };
  }
  if (filled.BENCH < rosterSlots.BENCH && availablePlayers.length > 0) {
    return { player: bestByRank(availablePlayers, values), slot: "BENCH" };
  }
  return null;
}

/**
 * Best-player-available drafting: ignores rigid slot-fill order (so it won't reach for a
 * mediocre QB just because that slot happens to be open) except for two real-draft
 * behaviors — kickers/defenses are punted until the final two rounds, and once a team's
 * remaining picks equal its remaining mandatory slots it switches to strict need-filling
 * so every slot is guaranteed to end up filled by the last round. Among closely-ranked
 * candidates it prefers whichever least stacks bye weeks with the roster already built.
 */
export function chooseBestPick(
  availablePlayers: PlayerProfile[],
  teamPicks: DraftPick[],
  rosterSlots: RosterSlots,
  values: Record<string, TradeValueEntry>,
  round: number,
  playersById: Map<string, PlayerProfile>,
): { player: PlayerProfile; slot: RosterSlotKey } | null {
  const filled = countFilledSlots(teamPicks);
  const rounds = totalRounds(rosterSlots);
  const picksRemaining = rounds - teamPicks.length;
  const unfilledMandatory = SLOT_PRIORITY.reduce(
    (sum, slot) => sum + Math.max(0, rosterSlots[slot] - filled[slot]),
    0,
  );

  if (picksRemaining <= unfilledMandatory) {
    return pickForNeed(availablePlayers, filled, rosterSlots, values);
  }

  let pool = availablePlayers.filter((p) => hasOpenSlot(p, filled, rosterSlots));

  const canDraftKickerDefense = round >= rounds - 1;
  if (!canDraftKickerDefense) {
    const withoutKickerDefense = pool.filter((p) => !isKickerOrDefense(p));
    if (withoutKickerDefense.length > 0) pool = withoutKickerDefense;
  }

  if (pool.length === 0) return pickForNeed(availablePlayers, filled, rosterSlots, values);

  const sorted = [...pool].sort((a, b) => rankOf(a, values) - rankOf(b, values));
  const topCandidates = sorted.slice(0, 3);

  let chosen = topCandidates[0];
  if (topCandidates.length > 1) {
    const rosterByeCounts = new Map<number, number>();
    for (const pick of teamPicks) {
      const rosterPlayer = playersById.get(pick.playerId);
      const bye = rosterPlayer ? byeWeekFor(rosterPlayer.team) : null;
      if (bye !== null) rosterByeCounts.set(bye, (rosterByeCounts.get(bye) ?? 0) + 1);
    }
    const byeOverlap = (p: PlayerProfile) => {
      const bye = byeWeekFor(p.team);
      return bye !== null ? (rosterByeCounts.get(bye) ?? 0) : 0;
    };
    chosen = topCandidates.reduce((a, b) => {
      const overlapA = byeOverlap(a);
      const overlapB = byeOverlap(b);
      if (overlapA !== overlapB) return overlapA < overlapB ? a : b;
      return rankOf(a, values) <= rankOf(b, values) ? a : b;
    });
  }

  return { player: chosen, slot: slotFor(chosen, filled, rosterSlots) };
}

/** Which roster slot a manually-picked player should be slotted into (first open slot they're eligible for). */
export function slotForManualPick(
  player: PlayerProfile,
  teamPicks: DraftPick[],
  rosterSlots: RosterSlots,
): RosterSlotKey {
  return slotFor(player, countFilledSlots(teamPicks), rosterSlots);
}

import type { DraftPick, RosterSlots } from "../types/draft";
import type { PlayerProfile } from "../types/player";
import type { TradeValueEntry } from "../types/tradeValue";

// Best-to-worst; percentile rank among the draft's teams picks an index into this scale,
// so the grade spread stays sensible whether it's a 4-team or 14-team mock.
const GRADE_SCALE = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"];

export interface GradedPick {
  pick: DraftPick;
  player: PlayerProfile;
  surplus: number; // pick slot minus actual rank — positive is a steal, negative is a reach
}

export interface TeamGrade {
  teamIndex: number;
  letter: string;
  totalSurplus: number;
  bestPick: GradedPick | null;
  worstPick: GradedPick | null;
  notes: string[];
}

function surplusFor(pick: DraftPick, player: PlayerProfile, values: Record<string, TradeValueEntry>): number {
  const rank = values[player.playerId]?.overallRank;
  // No ranking on record (deep waiver-wire bench flier) — treat as a neutral pick rather
  // than penalizing/crediting off a fabricated baseline.
  if (rank === undefined) return 0;
  return pick.overallPick - rank;
}

function letterFor(rankAmongTeams: number, numTeams: number): string {
  if (numTeams <= 1) return GRADE_SCALE[0];
  const percentile = rankAmongTeams / (numTeams - 1);
  const index = Math.round(percentile * (GRADE_SCALE.length - 1));
  return GRADE_SCALE[index];
}

export function gradeDraft(
  picks: DraftPick[],
  numTeams: number,
  rosterSlots: RosterSlots,
  values: Record<string, TradeValueEntry>,
  playersById: Map<string, PlayerProfile>,
): TeamGrade[] {
  const byTeam = new Map<number, GradedPick[]>();
  for (const pick of picks) {
    const player = playersById.get(pick.playerId);
    if (!player) continue;
    const graded: GradedPick = { pick, player, surplus: surplusFor(pick, player, values) };
    const list = byTeam.get(pick.teamIndex) ?? [];
    list.push(graded);
    byTeam.set(pick.teamIndex, list);
  }

  const totals = Array.from({ length: numTeams }, (_, teamIndex) => {
    const teamPicks = byTeam.get(teamIndex) ?? [];
    const totalSurplus = teamPicks.reduce((sum, p) => sum + p.surplus, 0);
    return { teamIndex, teamPicks, totalSurplus };
  });

  const sortedByValue = [...totals].sort((a, b) => b.totalSurplus - a.totalSurplus);
  const rankByTeam = new Map<number, number>();
  sortedByValue.forEach((t, i) => rankByTeam.set(t.teamIndex, i));

  return totals.map(({ teamIndex, teamPicks, totalSurplus }) => {
    const sortedPicks = [...teamPicks].sort((a, b) => b.surplus - a.surplus);
    const bestPick = sortedPicks[0] ?? null;
    const worstPick = sortedPicks[sortedPicks.length - 1] ?? null;

    const notes: string[] = [];
    for (const posSlot of ["RB", "WR"] as const) {
      const firstAtPos = teamPicks.find((p) => p.player.position === posSlot);
      if (firstAtPos && firstAtPos.pick.round >= 5) {
        notes.push(`First ${posSlot} came in Round ${firstAtPos.pick.round}`);
      }
    }
    const firstQb = teamPicks.find((p) => p.player.position === "QB");
    if (firstQb && rosterSlots.QB > 0) {
      notes.push(`First QB in Round ${firstQb.pick.round}`);
    }

    return {
      teamIndex,
      letter: letterFor(rankByTeam.get(teamIndex) ?? 0, numTeams),
      totalSurplus,
      bestPick,
      worstPick: worstPick && worstPick !== bestPick ? worstPick : null,
      notes,
    };
  });
}

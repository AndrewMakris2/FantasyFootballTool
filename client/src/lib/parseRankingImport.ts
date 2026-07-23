import type { PlayerProfile } from "../types/player";
import type { TradeValueEntry } from "../types/tradeValue";

export interface MatchedLine {
  line: string;
  lineIndex: number;
  player: PlayerProfile;
}

export interface AmbiguousLine {
  line: string;
  lineIndex: number;
  candidates: PlayerProfile[];
}

export interface UnmatchedLine {
  line: string;
  lineIndex: number;
}

export interface ParseRankingResult {
  matched: MatchedLine[];
  ambiguous: AmbiguousLine[];
  unmatched: UnmatchedLine[];
}

/**
 * Turns a pasted, ranked player list (one player per line, in rank order — messy
 * copy-paste like "12. Ja'Marr Chase WR CIN" is fine) into matched/ambiguous/unmatched
 * buckets by substring-matching each line against known player names.
 */
export function parseRankingList(text: string, players: PlayerProfile[]): ParseRankingResult {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const matched: MatchedLine[] = [];
  const ambiguous: AmbiguousLine[] = [];
  const unmatched: UnmatchedLine[] = [];

  lines.forEach((line, lineIndex) => {
    const lower = line.toLowerCase();
    const candidates = players.filter((p) => lower.includes(p.name.toLowerCase()));

    if (candidates.length === 0) {
      unmatched.push({ line, lineIndex });
      return;
    }

    if (candidates.length === 1) {
      matched.push({ line, lineIndex, player: candidates[0] });
      return;
    }

    const byTeam = candidates.filter((p) => lower.includes(p.team.toLowerCase()));
    if (byTeam.length === 1) {
      matched.push({ line, lineIndex, player: byTeam[0] });
    } else {
      ambiguous.push({ line, lineIndex, candidates });
    }
  });

  return { matched, ambiguous, unmatched };
}

/** Synthesizes TradeValueEntry-shaped data from a resolved, rank-ordered player list. */
export function buildValueEntries(
  resolvedMatches: { lineIndex: number; player: PlayerProfile }[],
): Record<string, TradeValueEntry> {
  const ordered = [...resolvedMatches].sort((a, b) => a.lineIndex - b.lineIndex);
  const positionCounts: Record<string, number> = {};
  const entries: Record<string, TradeValueEntry> = {};

  ordered.forEach(({ player }, index) => {
    const positionRank = (positionCounts[player.position] ?? 0) + 1;
    positionCounts[player.position] = positionRank;
    entries[player.playerId] = {
      sleeperId: player.playerId,
      value: (ordered.length - index) * 10,
      overallRank: index + 1,
      positionRank,
      trend30Day: 0,
    };
  });

  return entries;
}

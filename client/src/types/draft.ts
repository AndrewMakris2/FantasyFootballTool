import type { RankingFormat } from "../lib/rankingFormats";

export type RosterSlotKey = "QB" | "RB" | "WR" | "TE" | "FLEX" | "K" | "DEF" | "BENCH";

export type RosterSlots = Record<RosterSlotKey, number>;

export interface DraftSettings {
  numTeams: number;
  userTeamIndex: number; // 0-indexed
  format: RankingFormat;
  rosterSlots: RosterSlots;
}

export interface PickSlot {
  overallPick: number;
  round: number;
  teamIndex: number;
}

export interface DraftPick extends PickSlot {
  playerId: string;
  slot: RosterSlotKey;
}

import type { RankingFormat } from "../lib/rankingFormats";

export interface CheatSheetPlayerEntry {
  playerId: string;
  round: number | null;
  note: string;
  drafted: boolean;
}

export interface CheatSheet {
  id: string;
  name: string;
  scoringFormat: RankingFormat;
  numTeams: number;
  notes: string;
  players: CheatSheetPlayerEntry[];
  updatedAt: number;
}

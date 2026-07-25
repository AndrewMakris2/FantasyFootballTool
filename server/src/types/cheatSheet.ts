export type CheatSheetScoringFormat = "standard" | "half" | "full" | "dynasty";

export interface CheatSheetPlayerEntry {
  playerId: string;
  round: number | null;
  note: string;
  drafted: boolean;
}

export interface CheatSheet {
  id: string;
  name: string;
  scoringFormat: CheatSheetScoringFormat;
  numTeams: number;
  notes: string;
  players: CheatSheetPlayerEntry[];
  updatedAt: number;
}

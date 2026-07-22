export type FantasyPosition = "QB" | "RB" | "WR" | "TE" | "K" | "DEF";

export interface PlayerProfile {
  playerId: string;
  name: string;
  position: string;
  team: string;
  age: number | null;
  heightInches: number | null;
  weightLbs: number | null;
  college: string | null;
  yearsExp: number | null;
  jerseyNumber: number | null;
  status: string | null;
  injuryStatus: string | null;
  depthChartPosition: string | null;
  depthChartOrder: number | null;
}

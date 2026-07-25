import { apiGet } from "./client";
import type { SeasonStatsEntry } from "../types/playerStats";

export function getSeasonStats() {
  return apiGet<{ stats: Record<string, SeasonStatsEntry> }>("/player-stats");
}

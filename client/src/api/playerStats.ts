import { apiGet } from "./client";
import type { SeasonStatsEntry, WeeklyStatLine } from "../types/playerStats";

export function getSeasonStats() {
  return apiGet<{ stats: Record<string, SeasonStatsEntry> }>("/player-stats");
}

export function getWeeklyStats(playerId: string) {
  return apiGet<{ weeks: WeeklyStatLine[] }>(`/player-stats-weekly?playerId=${encodeURIComponent(playerId)}`);
}

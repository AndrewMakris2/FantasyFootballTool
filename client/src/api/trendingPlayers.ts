import { apiGet } from "./client";
import type { PlayerProfile } from "../types/player";

export interface TrendingPlayer extends PlayerProfile {
  trendCount: number;
}

export function getTrendingPlayers(type: "add" | "drop") {
  return apiGet<{ players: TrendingPlayer[] }>(`/trending-players?type=${type}`);
}

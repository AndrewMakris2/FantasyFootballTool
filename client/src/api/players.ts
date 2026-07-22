import { apiGet } from "./client";
import type { PlayerProfile } from "../types/player";

export function getPlayers() {
  return apiGet<{ players: PlayerProfile[] }>("/players");
}

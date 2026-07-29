import { apiGet, apiPost } from "./client";
import type { League, LeagueDraft, LeagueSummary, LeagueTransaction, Platform } from "../types/league";

export interface SleeperPreviewLeague {
  league_id: string;
  name: string;
  season: string;
}

export interface YahooPreviewLeague {
  league_key: string;
  league_id: string;
  name: string;
  season: string;
}

export function getLeagues() {
  return apiGet<{ leagues: LeagueSummary[]; errors: string[] }>("/leagues");
}

export function getLeagueDetail(platform: Platform, leagueId: string) {
  return apiGet<League>(`/leagues/${platform}/${leagueId}`);
}

export function getLeagueTransactions(platform: Platform, leagueId: string) {
  return apiGet<{ transactions: LeagueTransaction[] }>(`/leagues/${platform}/${leagueId}/transactions`);
}

export function getLeagueDraft(platform: Platform, leagueId: string) {
  return apiGet<LeagueDraft>(`/leagues/${platform}/${leagueId}/draft`);
}

export function previewSleeperLeagues(username: string) {
  return apiGet<{ userId: string; leagues: SleeperPreviewLeague[] }>(
    `/sleeper/preview?username=${encodeURIComponent(username)}`,
  );
}

export function linkSleeperLeagues(username: string, leagueIds: string[]) {
  return apiPost<{ ok: true }>("/sleeper/link", { username, leagueIds });
}

export function getSleeperStatus() {
  return apiGet<{ connected: boolean; username: string | null; leagueIds: string[] }>("/sleeper/status");
}

export function getYahooStatus() {
  return apiGet<{ connected: boolean; leagueKeys: string[] }>("/yahoo/status");
}

export function previewYahooLeagues() {
  return apiGet<{ leagues: YahooPreviewLeague[] }>("/yahoo/preview");
}

export function linkYahooLeagues(leagueKeys: string[]) {
  return apiPost<{ ok: true }>("/yahoo/link", { leagueKeys });
}

import { apiGet, apiPost } from "./client";

export function getWatchlist() {
  return apiGet<{ playerIds: string[] }>("/watchlist");
}

export function addToWatchlist(playerId: string) {
  return apiPost<{ playerIds: string[] }>("/watchlist", { playerId });
}

export async function removeFromWatchlist(playerId: string): Promise<{ playerIds: string[] }> {
  const res = await fetch(`/api/watchlist?playerId=${encodeURIComponent(playerId)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

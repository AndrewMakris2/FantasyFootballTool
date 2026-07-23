import { apiGet, apiPost } from "./client";
import type { TradeValueEntry } from "../types/tradeValue";
import type { CustomRankingSet } from "../types/customRanking";

export function getCustomRankingSets() {
  return apiGet<{ sets: Record<string, CustomRankingSet> }>("/custom-rankings");
}

export function saveCustomRankingSet(name: string, entries: Record<string, TradeValueEntry>) {
  return apiPost<{ ok: boolean }>("/custom-rankings", { name, entries });
}

export async function deleteCustomRankingSet(name: string): Promise<void> {
  const res = await fetch(`/api/custom-rankings?name=${encodeURIComponent(name)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
}

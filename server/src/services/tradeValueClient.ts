import { getStore } from "@netlify/blobs";
import type { TradeValueEntry } from "../types/tradeValue.js";

const BASE_URL = "https://api.fantasycalc.com/values/current";
const CACHE_MAX_AGE_MS = 12 * 60 * 60 * 1000;

interface FantasyCalcEntry {
  player: {
    sleeperId?: string | null;
  };
  value: number;
  overallRank: number;
  positionRank: number;
  trend30Day: number;
}

async function fetchFantasyCalcValues(isDynasty: boolean, ppr: number): Promise<FantasyCalcEntry[]> {
  const params = new URLSearchParams({
    isDynasty: String(isDynasty),
    numQbs: "1",
    numTeams: "12",
    ppr: String(ppr),
  });
  const res = await fetch(`${BASE_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`FantasyCalc API error ${res.status}`);
  }
  return (await res.json()) as FantasyCalcEntry[];
}

export async function getTradeValues(
  isDynasty: boolean,
  ppr: number = 1,
): Promise<Record<string, TradeValueEntry>> {
  const cacheKey = `${isDynasty ? "dynasty" : "redraft"}-ppr${ppr}`;
  const store = getStore("tradevalue-cache");
  const cached = await store.getWithMetadata(cacheKey, { type: "json" });
  const fetchedAt = cached?.metadata.fetchedAt as number | undefined;
  if (cached && fetchedAt && Date.now() - fetchedAt < CACHE_MAX_AGE_MS) {
    return cached.data;
  }

  const entries = await fetchFantasyCalcValues(isDynasty, ppr);
  const values: Record<string, TradeValueEntry> = {};
  for (const entry of entries) {
    if (!entry.player.sleeperId) continue;
    values[entry.player.sleeperId] = {
      sleeperId: entry.player.sleeperId,
      value: entry.value,
      overallRank: entry.overallRank,
      positionRank: entry.positionRank,
      trend30Day: entry.trend30Day,
    };
  }

  await store.setJSON(cacheKey, values, { metadata: { fetchedAt: Date.now() } });
  return values;
}

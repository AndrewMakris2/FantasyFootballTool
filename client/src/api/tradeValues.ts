import { apiGet } from "./client";
import type { TradeValueEntry } from "../types/tradeValue";

export function getTradeValues(dynasty: boolean) {
  return apiGet<{ values: Record<string, TradeValueEntry> }>(`/trade-values?dynasty=${dynasty}`);
}

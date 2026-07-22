import { apiGet } from "./client";
import type { TradeValueEntry } from "../types/tradeValue";

export function getTradeValues(dynasty: boolean, ppr: number = 1) {
  return apiGet<{ values: Record<string, TradeValueEntry> }>(`/trade-values?dynasty=${dynasty}&ppr=${ppr}`);
}

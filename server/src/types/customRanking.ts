import type { TradeValueEntry } from "./tradeValue.js";

export interface CustomRankingSet {
  name: string;
  entries: Record<string, TradeValueEntry>;
  createdAt: number;
}

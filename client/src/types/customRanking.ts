import type { TradeValueEntry } from "./tradeValue";

export interface CustomRankingSet {
  name: string;
  entries: Record<string, TradeValueEntry>;
  createdAt: number;
}

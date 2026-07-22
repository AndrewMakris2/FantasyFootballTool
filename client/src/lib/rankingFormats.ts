export type RankingFormat = "standard" | "half" | "full" | "dynasty";

export const FORMAT_PARAMS: Record<RankingFormat, { dynasty: boolean; ppr: number }> = {
  standard: { dynasty: false, ppr: 0 },
  half: { dynasty: false, ppr: 0.5 },
  full: { dynasty: false, ppr: 1 },
  dynasty: { dynasty: true, ppr: 1 },
};

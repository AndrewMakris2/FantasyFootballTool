export type RankingFormat = "standard" | "half" | "full" | "dynasty";

export const FORMAT_PARAMS: Record<RankingFormat, { dynasty: boolean; ppr: number }> = {
  standard: { dynasty: false, ppr: 0 },
  half: { dynasty: false, ppr: 0.5 },
  full: { dynasty: false, ppr: 1 },
  dynasty: { dynasty: true, ppr: 1 },
};

/** Where a draft/ranking should pull its player values from — a built-in scoring format, or a saved custom import. */
export type ValueSource = { kind: "builtin"; format: RankingFormat } | { kind: "custom"; name: string };

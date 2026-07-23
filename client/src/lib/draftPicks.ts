export interface DraftPickAsset {
  id: string;
  label: string;
  value: number;
}

// Synthetic dynasty-style pick value chart — neither Sleeper nor FantasyCalc publish
// real draft-pick values, so these are rough estimates scaled to roughly match the
// FantasyCalc player value range (an early 1st ≈ a fringe RB1/WR1).
const ROUND_BASE_VALUE: Record<number, number> = { 1: 5000, 2: 1500, 3: 500, 4: 200 };
const TIERS: { key: string; label: string; multiplier: number }[] = [
  { key: "early", label: "Early", multiplier: 1.15 },
  { key: "mid", label: "Mid", multiplier: 1.0 },
  { key: "late", label: "Late", multiplier: 0.85 },
];
// This year's picks, then next year's, then the year after — each future year discounted
// for the added uncertainty of not knowing draft order yet.
const YEAR_DISCOUNTS = [1, 0.8, 0.62];

function nextDraftYear(): number {
  const now = new Date();
  // The NFL draft happens in late April, so once we're past it, "this year's" picks are
  // already spent — the earliest tradeable class is next year's.
  return now.getMonth() >= 3 ? now.getFullYear() + 1 : now.getFullYear();
}

export function generateDraftPickAssets(): DraftPickAsset[] {
  const startYear = nextDraftYear();
  const assets: DraftPickAsset[] = [];

  YEAR_DISCOUNTS.forEach((yearDiscount, yearOffset) => {
    const year = startYear + yearOffset;
    for (const round of [1, 2, 3, 4]) {
      for (const tier of TIERS) {
        const value = Math.round(ROUND_BASE_VALUE[round] * tier.multiplier * yearDiscount);
        assets.push({
          id: `pick-${year}-${round}-${tier.key}`,
          label: `${year} Round ${round} (${tier.label})`,
          value,
        });
      }
    }
  });

  return assets;
}

export function isDraftPickId(id: string): boolean {
  return id.startsWith("pick-");
}

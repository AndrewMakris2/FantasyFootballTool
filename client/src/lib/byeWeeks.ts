// 2026 NFL bye weeks by team abbreviation. Update this table once the new season's
// schedule is released each year.
export const BYE_WEEKS_2026: Record<string, number> = {
  CAR: 5,
  KC: 5,
  CIN: 6,
  DET: 6,
  MIA: 6,
  MIN: 6,
  BUF: 7,
  JAX: 7,
  LAC: 7,
  WAS: 7,
  HOU: 8,
  NO: 8,
  NYG: 8,
  SF: 8,
  PIT: 9,
  TEN: 9,
  CHI: 10,
  DEN: 10,
  PHI: 10,
  TB: 10,
  ATL: 11,
  CLE: 11,
  GB: 11,
  LAR: 11,
  NE: 11,
  SEA: 11,
  BAL: 13,
  IND: 13,
  LV: 13,
  NYJ: 13,
  ARI: 14,
  DAL: 14,
};

export function byeWeekFor(team: string | null | undefined): number | null {
  if (!team) return null;
  return BYE_WEEKS_2026[team] ?? null;
}

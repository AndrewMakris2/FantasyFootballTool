// Primary accent color per NFL team, tuned to stay legible on our dark purple background
// (brand colors that are near-black are swapped for their brighter secondary here).
export const TEAM_COLORS: Record<string, string> = {
  ARI: "#97233F",
  ATL: "#A71930",
  BAL: "#2A1A80",
  BUF: "#00338D",
  CAR: "#0085CA",
  CHI: "#C83803",
  CIN: "#FB4F14",
  CLE: "#FF3C00",
  DAL: "#869397",
  DEN: "#FB4F14",
  DET: "#0076B6",
  GB: "#FFB612",
  HOU: "#A71930",
  IND: "#1B3F8B",
  JAX: "#00778B",
  KC: "#E31837",
  LAC: "#0080C6",
  LAR: "#FFA300",
  LV: "#A5ACAF",
  MIA: "#008E97",
  MIN: "#4F2683",
  NE: "#C60C30",
  NO: "#D8A63D",
  NYG: "#1B3F8B",
  NYJ: "#1EB980",
  PHI: "#00843D",
  PIT: "#FFB612",
  SEA: "#69BE28",
  SF: "#AA0000",
  TB: "#D50A0A",
  TEN: "#4B92DB",
  WAS: "#8B2942",
};

export function teamColor(team: string | null | undefined): string {
  if (!team) return "var(--muted)";
  return TEAM_COLORS[team] ?? "var(--muted)";
}

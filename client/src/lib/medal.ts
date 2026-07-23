export function medalClass(rank: number | undefined): string {
  if (rank === 1) return "rank-medal rank-medal--gold";
  if (rank === 2) return "rank-medal rank-medal--silver";
  if (rank === 3) return "rank-medal rank-medal--bronze";
  return "";
}

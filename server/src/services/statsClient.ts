import { getStore } from "@netlify/blobs";
import type { SeasonStatsEntry } from "../types/playerStats.js";
import { getSleeperCrosswalk } from "./sleeperClient.js";

// nflverse (https://github.com/nflverse/nflverse-data) publishes real per-player weekly
// stats as open data, explicitly licensed for public reuse — unlike proprietary "expert
// consensus" rankings (FantasyPros/ESPN/PFF/etc.), which require a paid API and aren't
// ours to scrape and redistribute. This gives real production numbers instead.
const STATS_CSV_URL = "https://github.com/nflverse/nflverse-data/releases/download/player_stats/player_stats.csv";
// nflverse's own player ID crosswalk (gsis_id <-> espn_id, among others). Sleeper's gsis_id
// field only covers a fraction of current players, so this gives a second hop to try before
// falling back to name matching.
const PLAYERS_CROSSWALK_URL = "https://github.com/nflverse/nflverse-data/releases/download/players/players.csv";
const CACHE_KEY = "season-stats";
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface AggregatedEntry extends SeasonStatsEntry {
  displayName: string;
  team: string;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

function toNum(value: string | undefined): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

async function fetchCsv(url: string): Promise<{ header: Record<string, number>; lines: string[] }> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`nflverse fetch error ${res.status} for ${url}`);
  }
  const text = await res.text();
  const lines = text.split("\n");
  const header = Object.fromEntries(parseCsvLine(lines[0]).map((h, i) => [h, i]));
  return { header, lines };
}

async function fetchGsisToEspnMap(): Promise<Record<string, string>> {
  const { header, lines } = await fetchCsv(PLAYERS_CROSSWALK_URL);
  const gsisIdx = header.gsis_id;
  const espnIdx = header.espn_id;

  const map: Record<string, string> = {};
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const f = parseCsvLine(line);
    if (f[gsisIdx] && f[espnIdx]) map[f[gsisIdx]] = f[espnIdx];
  }
  return map;
}

async function fetchSeasonStatsByGsisId(): Promise<Record<string, AggregatedEntry>> {
  const { header: idx, lines } = await fetchCsv(STATS_CSV_URL);
  const bySeasonType = idx.season_type;
  const bySeasonIdx = idx.season;
  const byPlayerIdx = idx.player_id;
  const byNameIdx = idx.player_display_name;
  const byTeamIdx = idx.recent_team;

  // The file spans every season back to 1999; only the most recently completed regular
  // season is useful for "how did this player actually perform" on a profile card. Parse
  // every row once, bucket by season, then keep just the max-season bucket — cheaper than
  // scanning the (quote-aware) CSV twice.
  const bySeason = new Map<number, Map<string, AggregatedEntry>>();
  let maxSeason = 0;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const f = parseCsvLine(line);
    if (f[bySeasonType] !== "REG") continue;
    const season = Number(f[bySeasonIdx]);
    if (season > maxSeason) maxSeason = season;

    let agg = bySeason.get(season);
    if (!agg) {
      agg = new Map<string, AggregatedEntry>();
      bySeason.set(season, agg);
    }

    const playerId = f[byPlayerIdx];
    let entry = agg.get(playerId);
    if (!entry) {
      entry = {
        season,
        displayName: f[byNameIdx],
        team: f[byTeamIdx],
        games: 0,
        completions: 0,
        attempts: 0,
        passingYards: 0,
        passingTds: 0,
        interceptions: 0,
        carries: 0,
        rushingYards: 0,
        rushingTds: 0,
        receptions: 0,
        targets: 0,
        receivingYards: 0,
        receivingTds: 0,
        fantasyPoints: 0,
        fantasyPointsPpr: 0,
      };
      agg.set(playerId, entry);
    }
    // Most-recent-team-seen wins, in case of a mid-season trade.
    entry.team = f[byTeamIdx];
    entry.games++;
    entry.completions += toNum(f[idx.completions]);
    entry.attempts += toNum(f[idx.attempts]);
    entry.passingYards += toNum(f[idx.passing_yards]);
    entry.passingTds += toNum(f[idx.passing_tds]);
    entry.interceptions += toNum(f[idx.interceptions]);
    entry.carries += toNum(f[idx.carries]);
    entry.rushingYards += toNum(f[idx.rushing_yards]);
    entry.rushingTds += toNum(f[idx.rushing_tds]);
    entry.receptions += toNum(f[idx.receptions]);
    entry.targets += toNum(f[idx.targets]);
    entry.receivingYards += toNum(f[idx.receiving_yards]);
    entry.receivingTds += toNum(f[idx.receiving_tds]);
    entry.fantasyPoints += toNum(f[idx.fantasy_points]);
    entry.fantasyPointsPpr += toNum(f[idx.fantasy_points_ppr]);
  }

  return Object.fromEntries(bySeason.get(maxSeason) ?? new Map());
}

export async function getSeasonStats(): Promise<Record<string, SeasonStatsEntry>> {
  const store = getStore("stats-cache");
  const cached = await store.getWithMetadata(CACHE_KEY, { type: "json" });
  const fetchedAt = cached?.metadata.fetchedAt as number | undefined;
  if (cached && fetchedAt && Date.now() - fetchedAt < CACHE_MAX_AGE_MS) {
    return cached.data;
  }

  const [statsByGsisId, gsisToEspn, crosswalk] = await Promise.all([
    fetchSeasonStatsByGsisId(),
    fetchGsisToEspnMap(),
    getSleeperCrosswalk(),
  ]);

  const bySleeperId: Record<string, SeasonStatsEntry> = {};
  for (const [gsisId, { displayName, team, ...entry }] of Object.entries(statsByGsisId)) {
    const nameKey = displayName.toLowerCase();
    const espnId = gsisToEspn[gsisId];

    const sleeperId =
      crosswalk.byGsisId[gsisId] ??
      (espnId ? crosswalk.byEspnId[espnId] : undefined) ??
      crosswalk.byNameTeam[`${nameKey}|${team}`] ??
      (crosswalk.byNameOnly[nameKey]?.length === 1 ? crosswalk.byNameOnly[nameKey][0] : undefined);

    if (!sleeperId) continue;
    bySleeperId[sleeperId] = entry;
  }

  await store.setJSON(CACHE_KEY, bySleeperId, { metadata: { fetchedAt: Date.now() } });
  return bySleeperId;
}

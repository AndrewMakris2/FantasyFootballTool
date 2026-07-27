import { getStore } from "@netlify/blobs";
import type { SeasonStatsEntry, WeeklyStatLine } from "../types/playerStats.js";
import { getSleeperCrosswalk, normalizeTeamAbbr } from "./sleeperClient.js";

// nflverse (https://github.com/nflverse/nflverse-data) publishes real per-player weekly
// stats as open data, explicitly licensed for public reuse — unlike proprietary "expert
// consensus" rankings (FantasyPros/ESPN/PFF/etc.), which require a paid API and aren't
// ours to scrape and redistribute. This gives real production numbers instead.
const STATS_CSV_URL = "https://github.com/nflverse/nflverse-data/releases/download/player_stats/player_stats.csv";
// nflverse's own player ID crosswalk (gsis_id <-> espn_id, among others). Sleeper's gsis_id
// field only covers a fraction of current players, so this gives a second hop to try before
// falling back to name matching.
const PLAYERS_CROSSWALK_URL = "https://github.com/nflverse/nflverse-data/releases/download/players/players.csv";
// Bump this whenever SeasonStatsEntry/WeeklyStatLine's shape changes — otherwise a stale
// cached blob from before the change keeps serving the old (missing-fields) shape for up
// to CACHE_MAX_AGE_MS, since cache invalidation here is purely time-based.
const CACHE_KEY = "player-stats-v3";
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Working accumulator used while summing weekly rows — a superset of the public
// SeasonStatsEntry shape, plus the extra running totals needed to derive ratio/average
// fields (pacr, racr, dakota, target/air-yards share, wopr) correctly at the end instead
// of naively summing or averaging values that aren't linear across weeks.
interface Accumulator extends Omit<SeasonStatsEntry, "pacr" | "dakota" | "racr" | "targetShare" | "airYardsShare" | "wopr"> {
  displayName: string;
  team: string;
  dakotaWeightedSum: number;
  dakotaAttempts: number;
  targetShareSum: number;
  targetShareCount: number;
  airYardsShareSum: number;
  airYardsShareCount: number;
  woprSum: number;
  woprCount: number;
}

interface ParsedPlayerStats {
  season: Record<string, SeasonStatsEntry>;
  weekly: Record<string, WeeklyStatLine[]>;
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

function toNullableNum(value: string | undefined): number | null {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function ratio(numerator: number, denominator: number): number | null {
  return denominator !== 0 ? numerator / denominator : null;
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

function newAccumulator(season: number, displayName: string, team: string): Accumulator {
  return {
    season,
    displayName,
    team,
    games: 0,
    completions: 0,
    attempts: 0,
    passingYards: 0,
    passingTds: 0,
    interceptions: 0,
    sacks: 0,
    sackYards: 0,
    passingAirYards: 0,
    passingYardsAfterCatch: 0,
    passingFirstDowns: 0,
    passingEpa: 0,
    passing2ptConversions: 0,
    carries: 0,
    rushingYards: 0,
    rushingTds: 0,
    rushingFumbles: 0,
    rushingFumblesLost: 0,
    rushingFirstDowns: 0,
    rushingEpa: 0,
    rushing2ptConversions: 0,
    receptions: 0,
    targets: 0,
    receivingYards: 0,
    receivingTds: 0,
    receivingFumbles: 0,
    receivingFumblesLost: 0,
    receivingAirYards: 0,
    receivingYardsAfterCatch: 0,
    receivingFirstDowns: 0,
    receivingEpa: 0,
    receiving2ptConversions: 0,
    specialTeamsTds: 0,
    fantasyPoints: 0,
    fantasyPointsPpr: 0,
    dakotaWeightedSum: 0,
    dakotaAttempts: 0,
    targetShareSum: 0,
    targetShareCount: 0,
    airYardsShareSum: 0,
    airYardsShareCount: 0,
    woprSum: 0,
    woprCount: 0,
  };
}

function finalize(acc: Accumulator): SeasonStatsEntry {
  const { displayName: _displayName, team: _team, dakotaWeightedSum, dakotaAttempts, targetShareSum, targetShareCount, airYardsShareSum, airYardsShareCount, woprSum, woprCount, ...rest } = acc;
  return {
    ...rest,
    pacr: ratio(acc.passingYards, acc.passingAirYards),
    racr: ratio(acc.receivingYards, acc.receivingAirYards),
    dakota: dakotaAttempts > 0 ? dakotaWeightedSum / dakotaAttempts : null,
    targetShare: targetShareCount > 0 ? targetShareSum / targetShareCount : null,
    airYardsShare: airYardsShareCount > 0 ? airYardsShareSum / airYardsShareCount : null,
    wopr: woprCount > 0 ? woprSum / woprCount : null,
  };
}

async function fetchParsedStatsByGsisId(): Promise<{
  season: Record<string, Accumulator>;
  weekly: Record<string, WeeklyStatLine[]>;
}> {
  const { header: idx, lines } = await fetchCsv(STATS_CSV_URL);
  const bySeasonType = idx.season_type;
  const bySeasonIdx = idx.season;
  const byPlayerIdx = idx.player_id;
  const byNameIdx = idx.player_display_name;
  const byTeamIdx = idx.recent_team;
  const byWeekIdx = idx.week;
  const byOpponentIdx = idx.opponent_team;

  // The file spans every season back to 1999; only the most recently completed regular
  // season is useful for "how did this player actually perform" on a profile card. Parse
  // every row once, bucket by season, then keep just the max-season bucket — cheaper than
  // scanning the (quote-aware) CSV twice.
  const bySeason = new Map<number, Map<string, Accumulator>>();
  const weeklyBySeason = new Map<number, Map<string, WeeklyStatLine[]>>();
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
      agg = new Map<string, Accumulator>();
      bySeason.set(season, agg);
    }
    let weeklyAgg = weeklyBySeason.get(season);
    if (!weeklyAgg) {
      weeklyAgg = new Map<string, WeeklyStatLine[]>();
      weeklyBySeason.set(season, weeklyAgg);
    }

    const playerId = f[byPlayerIdx];
    let entry = agg.get(playerId);
    if (!entry) {
      entry = newAccumulator(season, f[byNameIdx], f[byTeamIdx]);
      agg.set(playerId, entry);
    }

    entry.team = f[byTeamIdx]; // most-recent-team-seen wins, in case of a mid-season trade
    entry.games++;
    entry.completions += toNum(f[idx.completions]);
    entry.attempts += toNum(f[idx.attempts]);
    entry.passingYards += toNum(f[idx.passing_yards]);
    entry.passingTds += toNum(f[idx.passing_tds]);
    entry.interceptions += toNum(f[idx.interceptions]);
    entry.sacks += toNum(f[idx.sacks]);
    entry.sackYards += toNum(f[idx.sack_yards]);
    entry.passingAirYards += toNum(f[idx.passing_air_yards]);
    entry.passingYardsAfterCatch += toNum(f[idx.passing_yards_after_catch]);
    entry.passingFirstDowns += toNum(f[idx.passing_first_downs]);
    entry.passingEpa += toNum(f[idx.passing_epa]);
    entry.passing2ptConversions += toNum(f[idx.passing_2pt_conversions]);
    entry.carries += toNum(f[idx.carries]);
    entry.rushingYards += toNum(f[idx.rushing_yards]);
    entry.rushingTds += toNum(f[idx.rushing_tds]);
    entry.rushingFumbles += toNum(f[idx.rushing_fumbles]);
    entry.rushingFumblesLost += toNum(f[idx.rushing_fumbles_lost]);
    entry.rushingFirstDowns += toNum(f[idx.rushing_first_downs]);
    entry.rushingEpa += toNum(f[idx.rushing_epa]);
    entry.rushing2ptConversions += toNum(f[idx.rushing_2pt_conversions]);
    entry.receptions += toNum(f[idx.receptions]);
    entry.targets += toNum(f[idx.targets]);
    entry.receivingYards += toNum(f[idx.receiving_yards]);
    entry.receivingTds += toNum(f[idx.receiving_tds]);
    entry.receivingFumbles += toNum(f[idx.receiving_fumbles]);
    entry.receivingFumblesLost += toNum(f[idx.receiving_fumbles_lost]);
    entry.receivingAirYards += toNum(f[idx.receiving_air_yards]);
    entry.receivingYardsAfterCatch += toNum(f[idx.receiving_yards_after_catch]);
    entry.receivingFirstDowns += toNum(f[idx.receiving_first_downs]);
    entry.receivingEpa += toNum(f[idx.receiving_epa]);
    entry.receiving2ptConversions += toNum(f[idx.receiving_2pt_conversions]);
    entry.specialTeamsTds += toNum(f[idx.special_teams_tds]);
    entry.fantasyPoints += toNum(f[idx.fantasy_points]);
    entry.fantasyPointsPpr += toNum(f[idx.fantasy_points_ppr]);

    const weekAttempts = toNum(f[idx.attempts]);
    const dakota = toNullableNum(f[idx.dakota]);
    if (dakota !== null && weekAttempts > 0) {
      entry.dakotaWeightedSum += dakota * weekAttempts;
      entry.dakotaAttempts += weekAttempts;
    }

    const targetShare = toNullableNum(f[idx.target_share]);
    if (targetShare !== null) {
      entry.targetShareSum += targetShare;
      entry.targetShareCount++;
    }
    const airYardsShare = toNullableNum(f[idx.air_yards_share]);
    if (airYardsShare !== null) {
      entry.airYardsShareSum += airYardsShare;
      entry.airYardsShareCount++;
    }
    const wopr = toNullableNum(f[idx.wopr]);
    if (wopr !== null) {
      entry.woprSum += wopr;
      entry.woprCount++;
    }

    const weekLines = weeklyAgg.get(playerId) ?? [];
    weekLines.push({
      week: toNum(f[byWeekIdx]),
      opponentTeam: f[byOpponentIdx],
      completions: toNum(f[idx.completions]),
      attempts: weekAttempts,
      passingYards: toNum(f[idx.passing_yards]),
      passingTds: toNum(f[idx.passing_tds]),
      interceptions: toNum(f[idx.interceptions]),
      carries: toNum(f[idx.carries]),
      rushingYards: toNum(f[idx.rushing_yards]),
      rushingTds: toNum(f[idx.rushing_tds]),
      receptions: toNum(f[idx.receptions]),
      targets: toNum(f[idx.targets]),
      receivingYards: toNum(f[idx.receiving_yards]),
      receivingTds: toNum(f[idx.receiving_tds]),
      targetShare,
      wopr,
      fantasyPoints: toNum(f[idx.fantasy_points]),
      fantasyPointsPpr: toNum(f[idx.fantasy_points_ppr]),
    });
    weeklyAgg.set(playerId, weekLines);
  }

  const season = Object.fromEntries(bySeason.get(maxSeason) ?? new Map());
  const weekly = Object.fromEntries(
    [...(weeklyBySeason.get(maxSeason) ?? new Map())].map(([playerId, lines]) => [
      playerId,
      [...lines].sort((a, b) => a.week - b.week),
    ]),
  );
  return { season, weekly };
}

async function loadPlayerStats(): Promise<ParsedPlayerStats> {
  const store = getStore("stats-cache");
  const cached = await store.getWithMetadata(CACHE_KEY, { type: "json" });
  const fetchedAt = cached?.metadata.fetchedAt as number | undefined;
  if (cached && fetchedAt && Date.now() - fetchedAt < CACHE_MAX_AGE_MS) {
    return cached.data;
  }

  try {
    const [{ season: seasonByGsisId, weekly: weeklyByGsisId }, gsisToEspn, crosswalk] = await Promise.all([
      fetchParsedStatsByGsisId(),
      fetchGsisToEspnMap(),
      getSleeperCrosswalk(),
    ]);

    function resolveSleeperId(gsisId: string, displayName: string, team: string): string | undefined {
      const nameKey = displayName.toLowerCase();
      const espnId = gsisToEspn[gsisId];
      return (
        crosswalk.byGsisId[gsisId] ??
        (espnId ? crosswalk.byEspnId[espnId] : undefined) ??
        crosswalk.byNameTeam[`${nameKey}|${normalizeTeamAbbr(team)}`] ??
        (crosswalk.byNameOnly[nameKey]?.length === 1 ? crosswalk.byNameOnly[nameKey][0] : undefined)
      );
    }

    const season: Record<string, SeasonStatsEntry> = {};
    for (const [gsisId, acc] of Object.entries(seasonByGsisId)) {
      const sleeperId = resolveSleeperId(gsisId, acc.displayName, acc.team);
      if (!sleeperId) continue;
      season[sleeperId] = finalize(acc);
    }

    const weekly: Record<string, WeeklyStatLine[]> = {};
    for (const [gsisId, lines] of Object.entries(weeklyByGsisId)) {
      const acc = seasonByGsisId[gsisId];
      if (!acc) continue;
      const sleeperId = resolveSleeperId(gsisId, acc.displayName, acc.team);
      if (!sleeperId) continue;
      weekly[sleeperId] = lines;
    }

    const result: ParsedPlayerStats = { season, weekly };
    await store.setJSON(CACHE_KEY, result, { metadata: { fetchedAt: Date.now() } });
    return result;
  } catch (err) {
    // nflverse (or the Sleeper crosswalk it depends on) can have transient outages —
    // serving stale-but-present data beats a 502 and avoids a thundering herd of
    // concurrent re-fetches from every request that lands during the outage.
    if (cached) return cached.data;
    throw err;
  }
}

export async function getSeasonStats(): Promise<Record<string, SeasonStatsEntry>> {
  return (await loadPlayerStats()).season;
}

export async function getWeeklyStats(): Promise<Record<string, WeeklyStatLine[]>> {
  return (await loadPlayerStats()).weekly;
}

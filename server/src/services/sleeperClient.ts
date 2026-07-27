import { getStore } from "@netlify/blobs";
import type { League, Matchup, Player, TeamRoster, TeamStanding } from "../types/league.js";
import type { PlayerProfile } from "../types/player.js";

const FANTASY_POSITIONS = new Set(["QB", "RB", "WR", "TE", "K", "DEF"]);

const BASE_URL = "https://api.sleeper.app/v1";
// Bump the suffix if the cached shape/behavior ever changes — same reasoning as
// statsClient.ts's versioned cache key, so a stale blob can't silently linger.
const PLAYERS_CACHE_KEY = "players-v2";
const PLAYERS_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface SleeperUser {
  user_id: string;
  username: string;
  display_name: string;
}

interface SleeperLeague {
  league_id: string;
  name: string;
  season: string;
}

interface SleeperRoster {
  roster_id: number;
  owner_id: string;
  players: string[] | null;
  settings: {
    wins?: number;
    losses?: number;
    ties?: number;
    fpts?: number;
    fpts_against?: number;
  };
}

interface SleeperLeagueUser {
  user_id: string;
  display_name: string;
}

interface SleeperMatchup {
  roster_id: number;
  matchup_id: number;
  points: number;
}

interface SleeperPlayerMeta {
  full_name?: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  team?: string | null;
  age?: number | null;
  height?: string | null;
  weight?: string | null;
  college?: string | null;
  years_exp?: number | null;
  number?: number | null;
  // Real players use `status` (e.g. "Active"); team defenses only set `active` (boolean).
  status?: string | null;
  active?: boolean;
  injury_status?: string | null;
  depth_chart_position?: string | null;
  depth_chart_order?: number | null;
  gsis_id?: string | null;
  espn_id?: number | string | null;
}

async function sleeperGet<T>(pathname: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${pathname}`);
  if (!res.ok) {
    throw new Error(`Sleeper API error ${res.status} for ${pathname}`);
  }
  return (await res.json()) as T;
}

export async function findUserByUsername(username: string): Promise<SleeperUser> {
  return sleeperGet<SleeperUser>(`/user/${encodeURIComponent(username)}`);
}

// Sleeper's own idea of "the current season" — NOT the calendar year. Their season only
// rolls over around March/April, so using `new Date().getFullYear()` as a stand-in would
// query next season's (still-empty) leagues for the first few months of every year.
async function getCurrentSeason(): Promise<string> {
  const state = await sleeperGet<{ season: string }>("/state/nfl");
  return state.season;
}

export async function getLeaguesForUser(userId: string, season?: string): Promise<SleeperLeague[]> {
  const resolvedSeason = season ?? (await getCurrentSeason());
  return sleeperGet<SleeperLeague[]>(`/user/${userId}/leagues/nfl/${resolvedSeason}`);
}

async function getPlayersMap(): Promise<Record<string, SleeperPlayerMeta>> {
  const store = getStore("sleeper-cache");
  const cached = await store.getWithMetadata(PLAYERS_CACHE_KEY, { type: "json" });
  const fetchedAt = cached?.metadata.fetchedAt as number | undefined;
  if (cached && fetchedAt && Date.now() - fetchedAt < PLAYERS_CACHE_MAX_AGE_MS) {
    return cached.data;
  }

  const players = await sleeperGet<Record<string, SleeperPlayerMeta>>("/players/nfl");
  await store.setJSON(PLAYERS_CACHE_KEY, players, { metadata: { fetchedAt: Date.now() } });
  return players;
}

function toPlayer(playerId: string, meta: SleeperPlayerMeta | undefined): Player {
  return {
    playerId,
    name: meta?.full_name ?? (`${meta?.first_name ?? ""} ${meta?.last_name ?? ""}`.trim() || playerId),
    position: meta?.position ?? "UNK",
    team: meta?.team ?? null,
  };
}

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

function toPlayerProfile(playerId: string, meta: SleeperPlayerMeta): PlayerProfile {
  return {
    playerId,
    name: meta.full_name ?? (`${meta.first_name ?? ""} ${meta.last_name ?? ""}`.trim() || playerId),
    position: meta.position ?? "UNK",
    team: meta.team ?? "FA",
    age: toNumber(meta.age),
    heightInches: toNumber(meta.height),
    weightLbs: toNumber(meta.weight),
    college: meta.college ?? null,
    yearsExp: toNumber(meta.years_exp),
    jerseyNumber: toNumber(meta.number),
    status: meta.status ?? null,
    injuryStatus: meta.injury_status ?? null,
    depthChartPosition: meta.depth_chart_position ?? null,
    depthChartOrder: toNumber(meta.depth_chart_order),
  };
}

// Same "is this a real, current NFL roster player" check used everywhere we surface a
// player list — keeps the Player Database and Waiver Wire consistent instead of one
// filtering out inactive/free-agent players and the other not.
function isFantasyRelevant(meta: SleeperPlayerMeta): boolean {
  const isActive = meta.position === "DEF" ? meta.active === true : meta.status === "Active";
  if (!isActive) return false;
  if (!meta.team) return false;
  if (!meta.position || !FANTASY_POSITIONS.has(meta.position)) return false;
  return true;
}

export interface SleeperCrosswalk {
  byGsisId: Record<string, string>;
  byEspnId: Record<string, string>;
  byNameTeam: Record<string, string>;
  byNameOnly: Record<string, string[]>;
}

// Sleeper and nflverse occasionally disagree on the abbreviation for the same franchise
// (nflverse uses "LA" for the Rams, Sleeper uses "LAR") — normalize before using a team
// code as part of a cross-source lookup key, or matches silently never fire.
const TEAM_ABBR_ALIASES: Record<string, string> = {
  LA: "LAR",
};

export function normalizeTeamAbbr(team: string): string {
  return TEAM_ABBR_ALIASES[team] ?? team;
}

// nflverse (season stats) keys players by GSIS ID, not Sleeper ID. Sleeper's own gsis_id
// field only covers a fraction of current players (it's sparse/unmaintained even for
// stars), so statsClient falls back through espn_id, then name+team, then unique
// name-only matching — all built from data we're already caching, no extra fetch here.
export async function getSleeperCrosswalk(): Promise<SleeperCrosswalk> {
  const playersMap = await getPlayersMap();
  const byGsisId: Record<string, string> = {};
  const byEspnId: Record<string, string> = {};
  const byNameTeam: Record<string, string> = {};
  const byNameOnly: Record<string, string[]> = {};

  for (const [playerId, meta] of Object.entries(playersMap)) {
    if (meta.gsis_id) byGsisId[meta.gsis_id] = playerId;
    if (meta.espn_id) byEspnId[String(meta.espn_id)] = playerId;

    const name = meta.full_name ?? `${meta.first_name ?? ""} ${meta.last_name ?? ""}`.trim();
    if (!name) continue;
    const nameKey = name.toLowerCase();

    if (meta.team) byNameTeam[`${nameKey}|${normalizeTeamAbbr(meta.team)}`] = playerId;
    if (meta.position && FANTASY_POSITIONS.has(meta.position)) {
      (byNameOnly[nameKey] ??= []).push(playerId);
    }
  }

  return { byGsisId, byEspnId, byNameTeam, byNameOnly };
}

export async function getFantasyRelevantPlayers(): Promise<PlayerProfile[]> {
  const playersMap = await getPlayersMap();
  const profiles: PlayerProfile[] = [];

  for (const [playerId, meta] of Object.entries(playersMap)) {
    if (!isFantasyRelevant(meta)) continue;
    profiles.push(toPlayerProfile(playerId, meta));
  }

  return profiles;
}

interface SleeperTrendingEntry {
  player_id: string;
  count: number;
}

export async function getTrendingPlayers(
  type: "add" | "drop",
  limit = 25,
): Promise<(PlayerProfile & { trendCount: number })[]> {
  // Sleeper's trending endpoint includes inactive/free-agent players (whoever's being
  // added/dropped across all leagues), so over-fetch and filter+trim to `limit` after.
  const [trending, playersMap] = await Promise.all([
    sleeperGet<SleeperTrendingEntry[]>(`/players/nfl/trending/${type}?lookback_hours=24&limit=${limit * 4}`),
    getPlayersMap(),
  ]);

  const results: (PlayerProfile & { trendCount: number })[] = [];
  for (const entry of trending) {
    const meta = playersMap[entry.player_id];
    if (!meta || !isFantasyRelevant(meta)) continue;
    results.push({ ...toPlayerProfile(entry.player_id, meta), trendCount: entry.count });
    if (results.length >= limit) break;
  }
  return results;
}

export async function getLeagueDetail(leagueId: string, userId: string): Promise<League> {
  const [leagueMeta, rosters, users, playersMap] = await Promise.all([
    sleeperGet<SleeperLeague>(`/league/${leagueId}`),
    sleeperGet<SleeperRoster[]>(`/league/${leagueId}/rosters`),
    sleeperGet<SleeperLeagueUser[]>(`/league/${leagueId}/users`),
    getPlayersMap(),
  ]);

  const userNameByOwnerId = new Map(users.map((u) => [u.user_id, u.display_name]));
  const myRoster = rosters.find((r) => r.owner_id === userId);
  if (!myRoster) {
    throw new Error(`No roster found for user ${userId} in league ${leagueId}`);
  }

  const standings: TeamStanding[] = [...rosters]
    .sort((a, b) => (b.settings.wins ?? 0) - (a.settings.wins ?? 0) || (b.settings.fpts ?? 0) - (a.settings.fpts ?? 0))
    .map((r, index) => ({
      teamId: String(r.roster_id),
      teamName: userNameByOwnerId.get(r.owner_id) ?? `Team ${r.roster_id}`,
      record: {
        wins: r.settings.wins ?? 0,
        losses: r.settings.losses ?? 0,
        ties: r.settings.ties ?? 0,
      },
      pointsFor: r.settings.fpts ?? 0,
      pointsAgainst: r.settings.fpts_against ?? 0,
      rank: index + 1,
    }));

  const teams: TeamRoster[] = rosters.map((r) => ({
    teamId: String(r.roster_id),
    teamName: userNameByOwnerId.get(r.owner_id) ?? `Team ${r.roster_id}`,
    roster: (r.players ?? []).map((playerId) => toPlayer(playerId, playersMap[playerId])),
  }));

  let currentMatchup: Matchup | null = null;
  try {
    const state = await sleeperGet<{ week: number }>("/state/nfl");
    const matchups = await sleeperGet<SleeperMatchup[]>(`/league/${leagueId}/matchups/${state.week}`);
    const mine = matchups.find((m) => m.roster_id === myRoster.roster_id);
    const opponent = mine
      ? matchups.find((m) => m.matchup_id === mine.matchup_id && m.roster_id !== myRoster.roster_id)
      : undefined;
    if (mine && opponent) {
      const opponentRoster = rosters.find((r) => r.roster_id === opponent.roster_id);
      currentMatchup = {
        week: state.week,
        myScore: mine.points,
        opponentScore: opponent.points,
        opponentTeamName: opponentRoster
          ? userNameByOwnerId.get(opponentRoster.owner_id) ?? `Team ${opponent.roster_id}`
          : "Unknown",
      };
    }
  } catch {
    currentMatchup = null;
  }

  return {
    platform: "sleeper",
    leagueId,
    name: leagueMeta.name,
    season: leagueMeta.season,
    myTeam: {
      teamId: String(myRoster.roster_id),
      teamName: userNameByOwnerId.get(userId) ?? "My Team",
      record: {
        wins: myRoster.settings.wins ?? 0,
        losses: myRoster.settings.losses ?? 0,
        ties: myRoster.settings.ties ?? 0,
      },
      roster: (myRoster.players ?? []).map((playerId) => toPlayer(playerId, playersMap[playerId])),
    },
    teams,
    standings,
    currentMatchup,
  };
}

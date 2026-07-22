import { getStore } from "@netlify/blobs";
import type { League, Matchup, Player, TeamStanding } from "../types/league.js";

const BASE_URL = "https://api.sleeper.app/v1";
const CURRENT_SEASON = String(new Date().getFullYear());
const PLAYERS_CACHE_KEY = "players";
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

export async function getLeaguesForUser(userId: string, season = CURRENT_SEASON): Promise<SleeperLeague[]> {
  return sleeperGet<SleeperLeague[]>(`/user/${userId}/leagues/nfl/${season}`);
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
    standings,
    currentMatchup,
  };
}
